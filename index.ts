// big thanks to setup tutorial from https://blog.logrocket.com/how-to-set-up-node-typescript-express/

import express, { Express, NextFunction, Request, Response } from 'express';
import { PrismaClient} from "@prisma/client";
import dotenv from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';
import axios from 'axios';

import { updateAnalytics } from './src/datafetch/updateData'

interface userData {
  user_id : number,
  username : string,
  role : string
}
interface validationRequest extends Request {
  userData : userData
}


const accessValidation = (req : Request, res:Response, next : NextFunction) => {
  const validationRequest = req as validationRequest;
  const {authorization} = validationRequest.headers;
  if(!authorization){
    return res.status(401).json({isAuth: false, message: "Need token"});
  }

  const token = authorization.split(' ')[1];
  const secret = process.env.ACCESS_TOKEN_SECRET!;
  try {
    const jwtDecode = jwt.verify(token, secret);
    if(typeof jwtDecode !== 'string'){
    validationRequest.userData = jwtDecode as userData;
    }
  } catch (error) {
    return res.status(401).json({isAuth: false, message: "Unauthorized"});
  }
  next();
}


dotenv.config();
const jwt = require('jsonwebtoken');
const app: Express = express();
const port = process.env.REST_PORT;
const prisma = new PrismaClient();

(BigInt.prototype as any).toJSON = function () {
  return Number(this)
  };
app.use(cors())
app.use(bodyParser.json());  

app.get('/', (req: Request, res: Response) => {
  res.send('Express + TypeScript Serve');
});

app.get('/follow/:id' ,accessValidation,async (req: Request, res: Response) => {
    let integer = Number(req.params.id);
    const data = await prisma.$queryRaw`SELECT to_char(date,'Dy') as day, SUM(follower) as total FROM "UserAnalytic" WHERE user_id = ${integer} GROUP BY date,day ORDER BY date DESC LIMIT 7; `;
    res.json(data);
});
app.get('/post/:owner',accessValidation, async (req: Request, res: Response) => {
  let integer = parseInt(req.params.owner);
  const data = await prisma.$queryRaw`SELECT DISTINCT post_id from "PostAnalytic" WHERE owner_id = ${integer} ORDER BY post_id;`
  res.json(data);
});
app.get('/post/like/:owner',accessValidation, async (req: Request, res: Response) => {
  let integer = parseInt(req.params.owner);
  const data = await prisma.$queryRaw`SELECT to_char(date,'Dy') as day, SUM(likes) as total FROM "PostAnalytic" WHERE owner_id = ${integer} GROUP BY date,day ORDER BY date DESC LIMIT 7;`
  res.json(data);
});
app.get('/post/reply/:owner',accessValidation, async (req: Request, res: Response) => {
  let integer = parseInt(req.params.owner);
  const data = await prisma.$queryRaw`SELECT to_char(date,'Dy') as day, SUM(replies) as total FROM "PostAnalytic" WHERE owner_id = ${integer} GROUP BY date,day ORDER BY date DESC LIMIT 7;`
  res.json(data);
});
app.get('/post/view/:owner',accessValidation, async (req: Request, res: Response) => {
  let integer = parseInt(req.params.owner);
  const data = await prisma.$queryRaw`SELECT to_char(date,'Dy') as day, SUM(views) as total FROM "PostAnalytic" WHERE owner_id = ${integer} GROUP BY date,day ORDER BY date DESC LIMIT 7;`
  res.json(data);
});
app.get('/post/:owner/:id',accessValidation, async (req: Request, res: Response) => {
  let integer = parseInt(req.params.owner);
  let idpost = parseInt(req.params.id);
  const data = await prisma.$queryRaw`SELECT DISTINCT post_id from "PostAnalytic" WHERE owner_id = ${integer} AND post_id= ${idpost} ORDER BY post_id;`
  res.json(data);
});
app.get('/post/like/:owner/:id',accessValidation, async (req: Request, res: Response) => {
  let integer = parseInt(req.params.owner);
  let idpost = parseInt(req.params.id);
  const data = await prisma.$queryRaw`SELECT to_char(date,'Dy') as day, SUM(likes) as total FROM "PostAnalytic" WHERE owner_id = ${integer} AND post_id = ${idpost} GROUP BY date,day ORDER BY date DESC LIMIT 7;`
  res.json(data);
});
app.get('/post/reply/:owner/:id', accessValidation,async(req: Request, res: Response) => {
  let integer = parseInt(req.params.owner);
  let idpost = parseInt(req.params.id);
  const data = await prisma.$queryRaw`SELECT to_char(date,'Dy') as day, SUM(replies) as total FROM "PostAnalytic" WHERE owner_id = ${integer} AND post_id=${idpost} GROUP BY date,day ORDER BY date DESC LIMIT 7;`
  res.json(data);
});
app.get('/post/view/:owner/:id',accessValidation, async (req: Request, res: Response) => {
  let integer = parseInt(req.params.owner);
  let idpost = parseInt(req.params.id);
  const data = await prisma.$queryRaw`SELECT to_char(date,'Dy') as day, SUM(views) as total FROM "PostAnalytic" WHERE owner_id = ${integer} AND post_id=${idpost} GROUP BY date,day ORDER BY date DESC LIMIT 7;`
  res.json(data);
});

app.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  let test = true
  if(test){
    const data : any[] = await prisma.$queryRaw`SELECT * FROM "User" WHERE username = ${username};`
    if(data.length == 0){
      res.json({message: "error"});
    }
    else{
      const bycript = require('bcryptjs');
      const match = await bycript.compare(password, data[0].password);
      if(match){
        // res.json(data[0]);
        const datavalid = data[0]
        const user = {datavalid};
        const expiretime = 60*60*1;
        const accesstoken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET,{expiresIn: expiretime})
        const senddata = {
          accesstoken: accesstoken,
          user_id: datavalid.user_id,
          username: datavalid.username,
          role: datavalid.role
        }


        res.json(senddata);
      }
      else{
        res.json({message: "error"});
      }
    }
  }
  else{
    res.json({message: "error"});
  }
});

// type Header = {
//   [key:string]:string | undefined
// }

app.post('/register', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  let test = true
  //Ngga bisa konek ke soap :(
    
//   const xmlreq = `
//   <Envelope xmlns="http://schemas.xmlsoap.org/soap/envelope/">
//     <Body>
//         <getUnlockingByLinkCode xmlns="http://ws/">
//             <link_code xmlns="">${username}</link_code>
//         </getUnlockingByLinkCode>
//     </Body>
// </Envelope>
// `;

//   const headers : Header = {
//     'Content-Type': 'text/xml;charset=UTF-8',
//     SOAPAction: '#POST',
//     'api-key' : process.env.REST_SOAP_API_TOKEN
//   }
//   await axios.post('http://host.docker.internal:3003/ws/unlocking?wsdl', xmlreq, {headers: headers}).then((response) => {
//     res.send(response.data);
//   }).catch((error) => {
//     console.log()
//     res.send(error);
//   });
  if(test){
    try{
    const bycript = require('bcryptjs');
    const numSaltRounds = 8;
    const passwordhash = bycript.hashSync(password, numSaltRounds)
    const data = await prisma.$queryRaw`INSERT INTO "User" (username, password,role) VALUES (${username}, ${passwordhash},'user');`
    res.json({message: "success"});
    }catch(e){
      res.json({message: "error"});
    }
  }
  else{
    res.json({message: "error"});
  }
});

app.get('/refreshdata/:username', async (req: Request, res: Response) => {
  await updateAnalytics(req.params.username);
})


app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});