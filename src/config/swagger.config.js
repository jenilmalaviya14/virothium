const swaggerAutogen = require('swagger-autogen')();
const fs = require('fs');

const outputFile = './swagger-output.json';
const endpointsFiles = ['./routes/*.js'];

const doc = {
    info: {
        title: 'Virothium Analytics API',
        description: 'Virothium Analytics API Develop in Nodejs + MySQL',
    },
    host: '',
    schemes: ''
};

const generateSwaggerDocs = () => {
    return swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
        const swaggerDocument = require('../swagger-output.json');

        swaggerDocument.paths["/token/token-icon/{tokenAddress}"] = {
            "post": {
                "description": "",
                "consumes": ["multipart/form-data"],
                "parameters": [
                    {
                        "name": "tokenAddress",
                        "in": "path",
                        "required": true,
                        "type": "string"
                    },
                    {
                        "name": "privatekey",
                        "in": "header",
                        "type": "string"
                    },
                    {
                        "name": "tokenIcon",
                        "in": "formData",
                        "type": "file",
                        "description": "Token icon file",
                        "required": true
                    }
                ],
                "responses": {
                    "200": { "description": "OK" },
                    "400": { "description": "Bad Request" },
                    "401": { "description": "Unauthorized" },
                    "500": { "description": "Internal Server Error" }
                }
            }
        };

        fs.writeFileSync('../swagger-output.json', JSON.stringify(swaggerDocument, null, 2));

        return swaggerDocument;
    });
}

module.exports = { generateSwaggerDocs };