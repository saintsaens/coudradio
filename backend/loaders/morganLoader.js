import morgan from "morgan";

const morganLoader = (app) => {
    app.use(
        morgan(
            ':method :url :status [:date]',
        ));
};

export default morganLoader;