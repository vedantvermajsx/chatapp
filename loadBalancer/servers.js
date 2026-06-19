import dotenv from "dotenv";
dotenv.config();

export const serverslist = process.env.SERVERLIST.split(',');