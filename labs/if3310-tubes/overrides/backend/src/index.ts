// index.ts
import express, { Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { defineRoutes } from "./routes"; // Import the route definitions
import {startWebSocketServer} from "./utils/websocket";
const swaggerJSDoc = require('swagger-jsdoc'); 
const swaggerUi = require('swagger-ui-express');
import path from 'path';



const app: Express = express();

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

// Initialize routes
defineRoutes(app);



//websocket 
const portWebsocket = 8000;
startWebSocketServer(portWebsocket);
console.log(`WebSocket server started on port ${portWebsocket}`);

const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
          title: 'My API',
          version: '1.0.0',
          description: 'API documentation using Swagger',
        },
        servers: [
          {
              url: process.env.BACKEND_URL || `http://localhost:3000`,
          },
      ],
  },
  apis: [path.join(__dirname, 'routes.ts')], 
};

const swaggerDocs = swaggerJSDoc(swaggerOptions);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
const server = app.listen(3000, () => {
  console.log("Server listening on port 3000...");
});