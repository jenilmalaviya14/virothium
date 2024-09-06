require('dotenv').config();
const express = require("express");
const cors = require('cors');
const app = express();
const path = require('path');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const { setBaseURL } = require('./middlewares/upload.js');
const { generateSwaggerDocs } = require('./config/swagger.config.js');

require("./controller/transaction-details.controller.js");
require("./services/common-services/listen-common.service.js");
require("./services/common-services/cron-job.service.js");

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 min
    limit: 2000,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Too many requests from this IP, please try again after some time'
        });
    }
});

app.use(limiter);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

generateSwaggerDocs().then((swaggerDocument) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

    app.use(express.static(path.join(__dirname, "public")));
    app.use(express.static('./public'));
    app.use(setBaseURL);
    app.use(require("./routes/transaction.route.js"));
    app.use(require("./routes/pairs.route.js"));
    app.use(require("./routes/token.route.js"));
    app.use(require("./routes/dashboard.route.js"));
    app.use(require("./routes/account.route.js"));
    app.use(require("./routes/general-setting.route.js"));

    app.use((req, res, next) => {
        res.status(404).json({ success: false, message: "Route not found!" });
    });

    const PORT = process.env.PORT;
    app.listen(PORT, () => {
        console.log(`SERVER IS RUNNING ON PORT ${PORT}`);
    });
}).catch((err) => {
    console.error('Error generating Swagger documentation:', err);
});