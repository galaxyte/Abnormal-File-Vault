
# Abnormal File Vault 🔐

A production-grade file hosting application with smart deduplication, secure authentication, and advanced search capabilities.

## 🚀 Features

- **Secure Authentication**: JWT-based authentication with Django REST Framework
- **Smart File Deduplication**: Automatic duplicate detection using SHA256 hashing
- **Advanced Search**: Filter by filename, type, date, and owner
- **File Management**: Upload, download, and delete files with ease
- **Responsive UI**: Modern React frontend with Tailwind CSS
- **Production Ready**: Dockerized with PostgreSQL and Nginx

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Django REST Framework, PostgreSQL
- **DevOps**: Docker, Docker Compose, Nginx
- **Authentication**: JWT tokens with refresh mechanism

## 🏗️ Architecture

```
Frontend (React) ↔ Nginx ↔ Django REST API ↔ PostgreSQL
                                    ↓
                               File Storage
```

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Git

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd abnormal-file-vault
```

2. **Start the application**
```bash
docker-compose up --build
```

3. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Admin Panel: http://localhost:8000/admin

### Development Setup

1. **Backend Setup**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. **Database Setup**
```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

3. **Frontend Setup**
```bash
npm install
npm run dev
```

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login
- `POST /api/auth/verify/` - Token verification
- `GET /api/auth/profile/` - User profile

### File Endpoints
- `GET /api/files/` - List user files
- `POST /api/files/upload/` - Upload file
- `GET /api/files/{id}/download/` - Download file
- `DELETE /api/files/{id}/` - Delete file
- `GET /api/files/search/` - Search files

## 🔐 Security Features

- JWT authentication with refresh tokens
- File access control per user
- CORS protection
- Input validation and sanitization
- Secure file upload handling

## 📊 File Deduplication

The system uses SHA256 hashing to identify duplicate files:
- Files with identical content share the same storage
- Each user maintains their own file references
- Deleting a file only removes it from storage when no other users reference it

## 🐳 Docker Configuration

### Services
- **db**: PostgreSQL database
- **backend**: Django REST API
- **frontend**: React app served by Nginx

### Volumes
- `postgres_data`: Database persistence
- `media_files`: File storage persistence

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1,yourdomain.com
DB_NAME=file_vault
DB_USER=postgres
DB_PASSWORD=your-secure-password
DB_HOST=db
DB_PORT=5432
```

### File Upload Limits
- Maximum file size: 100MB
- Supported formats: All file types
- Storage: Organized by file hash for deduplication

## 🚀 Deployment

### Production Deployment

1. **Update environment variables**
```bash
cp backend/.env.example backend/.env
# Edit .env with production values
```

2. **Deploy with Docker Compose**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

3. **Run database migrations**
```bash
docker-compose exec backend python manage.py migrate
```

## 📈 Performance Optimizations

- Database indexing on file hashes and user relationships
- Efficient file deduplication algorithm
- Pagination for large file lists
- Optimized Docker images with multi-stage builds
- Nginx reverse proxy for static file serving

## 🧪 Testing

```bash
# Backend tests
cd backend
python manage.py test

# Frontend tests
npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure PostgreSQL is running
   - Check database credentials in .env

2. **File Upload Fails**
   - Check file size limits
   - Verify media directory permissions

3. **Frontend Can't Connect to API**
   - Ensure backend is running on port 8000
   - Check CORS settings

### Logs

```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db
```

## 🔄 Backup and Restore

### Database Backup
```bash
docker-compose exec db pg_dump -U postgres file_vault > backup.sql
```

### Database Restore
```bash
docker-compose exec -T db psql -U postgres file_vault < backup.sql
```

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the troubleshooting guide

---

Built with ❤️ using Django, React, and Docker
