# DynamoDB Backup to S3

This project is a Node.js application that allows you to backup DynamoDB tables to an S3 bucket. It provides an API endpoint for initiating the backup process.

## Prerequisites

Before starting, ensure you have the following:

- Node.js installed on your machine
- AWS credentials with appropriate permissions to access DynamoDB and S3

## Getting Started

1. Clone the repository:
```
git clone https://github.com/jacksonkasi1/dynamodb-backup-restore.git
```

2. Install the dependencies by navigating into the project directory and running:
```
npm install
```


3. Configure AWS credentials:

Open the `app.js` file and replace `'YOUR_AWS_ACCESS_KEY'` and `'YOUR_AWS_SECRET_KEY'` with your own AWS access key and secret key.

4. Set up the S3 bucket:

- Create an S3 bucket to store the backups.
- Replace `'dynamo-backup'` with your own bucket name in the `s3BucketName` variable in the `app.js` file.

5. Start the application:
```
node server.js
```


The server will start listening on port 3000.

## API Usage

The API provides a single endpoint for initiating the backup process:

### Backup Tables to S3 [/backup]

- Method: `POST`
- URL: `http://localhost:3000/backup`
- Query Parameters:
- `tables`: A comma-separated list of DynamoDB table names to backup. For example, `tables=table1,table2,table3`.
- Response:
- Status: `200 OK` if the backup process completes successfully.
- Status: `500 Internal Server Error` if an error occurs during the backup process.

To initiate a backup, make a POST request to the `/backup` endpoint with the `tables` query parameter specifying the table names you want to back up.

Example usage with cURL:
```
curl -X POST 'http://localhost:3000/backup?tables=table1,table2,table3'
```


Note: Make sure to replace the table names with your own DynamoDB table names.

## Notes

- This project assumes you have already set up the necessary DynamoDB tables.
- Make sure your AWS credentials have appropriate permissions to perform backup operations on DynamoDB and S3.
