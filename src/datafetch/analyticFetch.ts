import axios from 'axios';

require('dotenv').config();

const PHP_APP_API_URL = `${process.env.MONOLITHIC_APP_URL}/api`;

const USER_ANALYTIC_API_URL = `${PHP_APP_API_URL}/getdatafollows`;

const POST_COUNT_API_URL = `${PHP_APP_API_URL}/getpostcount`;
const POST_ANALYTIC_API_URL = `${PHP_APP_API_URL}/getpostdata`;

export async function userAnalyticFetchHandler(user: string, date: string) {
    // console.log(`${USER_ANALYTIC_API_URL}/${user}/${date}`);
    const response = await axios.get(`${USER_ANALYTIC_API_URL}/${user}/${date}`);

    if(response.data.status !== 'success') return null;
    return response.data.data;
}

export async function postCountFetchHandler(user: string) {
    const response = await axios.get(`${POST_COUNT_API_URL}/${user}`);
    
    if(response.data.status !== "success") return null;
    return response.data.data;
}

export async function postAnalyticFetchHandler(user: string, post_id: number,  date: string) {
    const response = await axios.get(`${POST_ANALYTIC_API_URL}/${user}/${post_id}/${date}`);
    
    if(response.data.status !== "success") return null;
    return response.data.data;
}