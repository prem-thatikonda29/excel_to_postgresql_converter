# Harrier - Excel Data Management System

A web application that allows users to upload and process Excel files (XLSX, XLS, CSV) and store the data in a PostgreSQL database.

## Features

- Excel file upload and processing
- Automatic database table creation based on Excel structure
- Support for multiple file formats (XLSX, XLS, CSV)
- Real-time data processing
- Cross-Origin Resource Sharing (CORS) enabled
- Environment-based configuration

## Tech Stack

- **Frontend**: React (Vite)
- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **File Processing**: xlsx library
- **File Upload**: Multer

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn package manager

## Project Structure

```plaintext
harrier/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── routes/
│   │   └── uploadRoutes.js
│   ├── uploads/          # Temporary storage for uploaded files
│   ├── .env             # Environment variables
│   ├── .gitignore
│   ├── package.json
│   └── server.js
└── frontend/            # React application (Vite)
```

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the backend directory with the following variables:

```plaintext
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_HOST=localhost
DB_PORT=5432
PORT=5500
```

4. Start the backend server:

```bash
npm start
```

### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## API Endpoints

### File Upload

- **POST** `/upload`
  - Accepts multipart form data with file upload
  - Supports XLSX, XLS, and CSV files
  - Creates database table automatically based on file structure
  - Returns processed data information

### Test Connection

- **GET** `/test`
  - Tests if the server is running
  - Returns a simple status message

## Database Schema

Tables are created dynamically based on the uploaded Excel file structure. Column types are automatically determined based on the data:

- Text data → TEXT
- Integer numbers → INTEGER
- Decimal numbers → NUMERIC
- Date values → TIMESTAMP
- Boolean values → BOOLEAN

## Error Handling

The application includes comprehensive error handling for:

- Invalid file types
- Database connection issues
- File processing errors
- Data insertion failures

## Development

### Environment Variables

The backend uses the following environment variables:

- `DB_NAME`: PostgreSQL database name
- `DB_USER`: Database username
- `DB_PASSWORD`: Database password
- `DB_HOST`: Database host (default: localhost)
- `DB_PORT`: Database port (default: 5432)
- `PORT`: Backend server port (default: 5500)

### File Upload Limitations

- Supported file types: .xlsx, .xls, .csv
- Files are temporarily stored in the `uploads` directory

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request
