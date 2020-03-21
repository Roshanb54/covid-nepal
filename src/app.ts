import Express, { Application, Response, Request, NextFunction, Errback } from "express";
import { IApplicationOptions, IDatabaseConnectionOptions } from "./shared/interfaces";
import { connect } from "mongoose";
import cors from "cors"

export default class App {
    private app: Application;
    port: number;

    constructor({ controllers, middlewares, port }: IApplicationOptions) {
        this.app = Express();
        this.port = port;

        this.middlewares(middlewares);
        this.createDatabaseConnection({
            database: process.env.DB_DATABASE,
            username: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT, 10)
        });
        this.initRoutes(controllers);
    }

    async createDatabaseConnection(connOptions: IDatabaseConnectionOptions) {
        try {
            let connectionUri = `mongodb://${connOptions.host}:${connOptions.port}/${connOptions.database}`;
            if (connOptions.username || connOptions.password) {
                connectionUri = `mongodb://${connOptions.username || ''}:${connOptions.password || ''}@${connOptions.host}:${connOptions.port}/${connOptions.database}`;
            }

            await connect(connectionUri, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                useFindAndModify: false
            });

        } catch (error) {
            console.warn("Error connecting to database");
            console.log(error);
        }
    }

    initRoutes(controllers: any[]) {
        this.app.get('/', function (request: Request, response: Response) {
            response.json({
                status: "UP"
            });
        })

        controllers.forEach(controller => {
            this.app.use(`/${controller.route}`, controller.router);
        })

    }

    middlewares(middlewares: any[]) {
        this.app.use(cors())
        this.app.disable('x-powered-by')
        middlewares.forEach(middleware => {
            this.app.use(middleware);
        })
    }

    run(cb: () => void) {
        this.app.listen(this.port, cb);
    }
}