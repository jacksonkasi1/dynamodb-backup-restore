# DynamoDB Backup & Restore API


[![GitHub Views](https://komarev.com/ghpvc/?username=jacksonkasi1&label=Views&color=brightgreen)](https://github.com/jacksonkasi1/dynamodb-backup-restore)
[![GitHub Clones](https://img.shields.io/badge/dynamic/json?color=brightgreen&label=Clones&query=%24.count&suffix=%20clones&url=https%3A%2F%2Fapi.github.com%2Frepos%2Fjacksonkasi1%2Fdynamodb-backup-restore%2Ftraffic%2Fclones)](https://github.com/jacksonkasi1/dynamodb-backup-restore)


## Description
This API provides functionality for taking bulk backups of DynamoDB tables and restoring them when needed. It leverages the AWS SDK and various npm packages to simplify the backup and restore process.

## Prerequisites
- Node.js installed on your machine
- AWS account with DynamoDB tables set up
- AWS access key and secret access key with appropriate permissions

## Installation
1. Clone the repository: `git clone https://github.com/jacksonkasi1/dynamodb-backup-restore.git`
2. Navigate to the project directory: `cd dynamodb-backup-restore`
3. Install dependencies: `npm install`

## Configuration
1. Rename `.env.example` to `.env`.
2. Open `.env` file and update the following variables with your AWS credentials and desired settings:
   - `AWS_ACCESS_KEY_ID`: Your AWS access key ID.
   - `AWS_SECRET_ACCESS_KEY`: Your AWS secret access key.
   - `AWS_REGION`: The AWS region where your DynamoDB tables are located.
   - `AWS_BUCKET_NAME`: The name of the S3 bucket to store backups.

## Usage
1. Start the server: `npm start`
2. Use your preferred API testing tool (e.g., Postman) to send requests to the available endpoints:
   - `POST /backup/table-list`: Takes a list of table names as input and creates backups for each table.
   - `POST /backup/table-all`: Creates backups for all tables in the DynamoDB.
   - `POST /restore/table-all`: Restores tables from JSON backup files stored in the specified S3 path.
   - `GET /bucket/download`: Downloads all objects from the specified S3 bucket and provides them as a zip file.
   - `POST /bucket/upload`: Uploads a zip file containing objects to the specified S3 bucket.

## Documentation
For detailed API documentation and example requests, refer to the [Postman documentation](https://documenter.getpostman.com/view/24023893/2s93sabDiU).

## Blog
For more insights and discussions related to restoring DynamoDB table backups using an API endpoint, check out our blog post on https://jacksonkasi1.hashnode.dev/restoring-dynamodb-table-backup-using-an-api-endpoint.

## Issues
If you encounter any issues or have suggestions for improvements, please submit them on the [GitHub Issues](https://github.com/jacksonkasi1/dynamodb-backup-restore/issues) page.

## License
This project is licensed under the [ISC License](LICENSE).
