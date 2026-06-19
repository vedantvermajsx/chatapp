import { serverslist } from './servers.js'
import LoadBalancer from "./LoadBalancer.js";
import dotenv from 'dotenv'


dotenv.config()


const loadBalancer = new LoadBalancer(serverslist, {
  port: process.env.PORT || 8080
});

loadBalancer.start();