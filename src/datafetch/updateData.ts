import { PrismaClient, User, UserAnalytic } from "@prisma/client";
import { error } from "console";

import { userAnalyticFetchHandler, postCountFetchHandler, postAnalyticFetchHandler } from './analyticFetch';

const prisma = new PrismaClient();

const currentDate: String = (new Date()).toISOString().split('T')[0];

function toISODate(date: Date): string {
    return date.toISOString().split('T')[0];
}

function incrementDateBy(date: Date, delta: number) {
    date.setDate(date.getDate() + delta);
}

export async function updateAnalytics(username: string, interval: number = 7) {
    const user: { user_id: number } | null = await prisma.user.findUnique({
        where: {
            username: username
        },
        select: {
            user_id: true
        }
    });

    if (user === null) throw error;

    const user_id = user.user_id;

    const latest_date: {date: Date} | null = await prisma.userAnalytic.findFirst({
        where: {
            user_id: user_id
        },
        select: {
            date: true
        },
        orderBy: {
            date: 'desc'
        }
    });

    // let updateData : boolean = false;

    // WARNING: NEW DATE USES UTC TIMESTAMP
    const currentDate = new Date();
    currentDate.setHours(0,0,0,0);

    const interval_subtracted = new Date(currentDate);
    incrementDateBy(interval_subtracted, -interval);

    let fetch_last_date: Date;
    // no analytic data yet, must create new entries
    if(latest_date === null) {
        fetch_last_date = new Date(interval_subtracted);
    }
    else {
        // if latest date is within interval, only update the data at the date,
        // then create new entries from the date onward to this date
        if(latest_date.date >= interval_subtracted) {
            // updateData = true;
            fetch_last_date = new Date(latest_date.date);
        }
        // else, the data is *outdated*, retrieve and create
        // new entries in the interval
        else {
            fetch_last_date = new Date(interval_subtracted);
        }
    }

    // if(updateData) {
    //     const newUserAnalytic = await userAnalyticFetchHandler(username, toISODate(fetch_last_date));
    //     await prisma.userAnalytic.update({
    //         where: {
    //             user_id: user_id,
    //             date: fetch_last_date
    //         },
    //         data: {
    //             follower: newUserAnalytic.total
    //         }
    //     })
    //     console.log(newUserAnalytic);
    //     incrementDateBy(fetch_last_date, 1);
    // }
    while(fetch_last_date <= currentDate) {
        const stringDate = toISODate(fetch_last_date);

        updateUserAnalytic(username, user_id, new Date(fetch_last_date));
        updatePostAnalytic(username, user_id, new Date(fetch_last_date));
        
        incrementDateBy(fetch_last_date, 1);
    }
}

async function updateUserAnalytic(username:string, user_id:number, fetch_last_date:Date) {
    const stringDate = toISODate(fetch_last_date);
    const newUserAnalytic = await userAnalyticFetchHandler(username, stringDate);
    // console.log(newUserAnalytic);
    await prisma.userAnalytic.upsert({
        where: {
            user_id_date: {
                user_id: user_id,
                date: fetch_last_date
            }
        },
        update: {
            follower: newUserAnalytic.total
        },
        create: {
            user_id: user_id,
            date: fetch_last_date,
            follower: newUserAnalytic.total
        }
    });
}

async function updatePostAnalytic(username:string, user_id:number, fetch_last_date:Date) {
    const stringDate = toISODate(fetch_last_date);
    const userPostCount = await postCountFetchHandler(username);
    // console.log(userPostCount)
    for(let i = 0; i < userPostCount.count; i++) {
        // this can be improved with all posts data api call
        const newPostAnalytic = await postAnalyticFetchHandler(username, i, stringDate);
        // console.log(newPostAnalytic)
        await prisma.postAnalytic.upsert({
            where: {
                post_id_owner_id_date: {
                    post_id: i,
                    owner_id: user_id,
                    date: fetch_last_date
                }
            },
            update: {
                views: newPostAnalytic.views,
                likes: newPostAnalytic.likes,
                replies: newPostAnalytic.replies
            },
            create: {
                post_id: i,
                owner_id: user_id,
                date: fetch_last_date,
                views: newPostAnalytic.views,
                likes: newPostAnalytic.likes,
                replies: newPostAnalytic.replies
            }
        });
    }
}