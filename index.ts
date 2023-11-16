// big thanks to setup tutorial from https://blog.logrocket.com/how-to-set-up-node-typescript-express/

import express, { Express, Request, Response } from 'express';
import { PrismaClient} from "@prisma/client";
import dotenv from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';
import axios from 'axios';

dotenv.config();

const app: Express = express();
const port = process.env.REST_PORT;
const prisma = new PrismaClient();


app.use(cors())
app.use(bodyParser.json());

function getday(day : string){
    const dateObject = new Date(day);
    const options: Intl.DateTimeFormatOptions = { weekday: 'long' };
    const dayName = dateObject.toLocaleDateString('en-US', options);
    return dayName;
}

app.get('/', (req: Request, res: Response) => {
  res.send('Express + TypeScript Serve');
});

app.get('/follows/:id', (req: Request, res: Response) => {
    let query = `SELECT to_char(date,'Dy') as day, SUM(follower) as total FROM "UserAnalytic" WHERE user_id = ${req.params.id} GROUP BY date,day ORDER BY date; `;
    const data = prisma.$queryRaw`SELECT to_char(date,'Dy') as day, SUM(follower) as total FROM "UserAnalytic" WHERE user_id = ${req.params.id} GROUP BY date,day ORDER BY date; `;
    res.send(data);
});
app.get('/post/:owner', async (req: Request, res: Response) => {
  let integer = parseInt(req.params.owner);
  const data = await prisma.$queryRaw`SELECT DISTINCT post_id from "PostAnalytic" WHERE owner_id = ${integer} ORDER BY post_id;`
  res.json(data);
});
app.get('/post/like/:owner', async (req: Request, res: Response) => {
  let integer = parseInt(req.params.owner);
  const data = await prisma.$queryRaw`SELECT to_char(date,'Dy') as day, SUM(likes) as total, date FROM "PostAnalytic" WHERE owner_id = ${integer} GROUP BY date,day ORDER BY date DESC LIMIT 7;`
  res.json(data);
});
app.get('/post/reply/:owner', (req: Request, res: Response) => {
  let query = "SELECT to_char(date,'Dy') as day, SUM(reply) as total FROM PostAnalytic WHERE owner_id = " + req.params.owner + " GROUP BY date,day ORDER BY date;";
  res.send(query);
});
app.get('/post/view/:owner', (req: Request, res: Response) => {
  let query = "SELECT to_char(date,'Dy') as day, SUM(view) as total FROM PostAnalytic WHERE owner_id = " + req.params.owner + " GROUP BY date,day ORDER BY date;";
  res.send(query);
});
app.get('/post/:owner/:id', (req: Request, res: Response) => {
  let query = "SELECT DISTINCT post_id from PostAnalytic WHERE user_id = " + req.params.owner + " AND post_id = " + req.params.id + ";"
  res.send(query);
});
app.get('/post/like/:owner/:id', (req: Request, res: Response) => {
  let query = "SELECT to_char(date,'Dy') as day, SUM(like) as total FROM PostAnalytic WHERE owner_id = " + req.params.owner + " AND post_id = " + req.params.id + " GROUP BY date,day ORDER BY date;";
  res.send(query);
});
app.get('/post/reply/:owner/:id', (req: Request, res: Response) => {
  let query = "SELECT to_char(date,'Dy') as day, SUM(reply) as total FROM PostAnalytic WHERE owner_id = " + req.params.owner + " AND post_id = " + req.params.id + " GROUP BY date,day ORDER BY date;";
  res.send(query);
});
app.get('/post/view/:owner/:id', (req: Request, res: Response) => {
  let query = "SELECT to_char(date,'Dy') as day, SUM(view) as total FROM PostAnalytic WHERE owner_id = " + req.params.owner + " AND post_id = " + req.params.id + " GROUP BY date,day ORDER BY date;";
  res.send(query);
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});