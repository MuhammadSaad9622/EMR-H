# 🏥 Wellness Studio EMR

A comprehensive Electronic Medical Records (EMR) system designed for healthcare providers to efficiently manage patients, visits, appointments, billing, and medical reports. Built with modern web technologies and featuring AI-powered narrative report generation.

## ✨ Features

### 🔐 Authentication & Authorization
- Secure JWT-based authentication
- Role-based access control (Admin, Doctor)
- Protected routes and API endpoints

### 👥 Patient Management
- Complete patient profile management
- Medical history tracking (allergies, medications, conditions, surgeries)
- Subjective assessment data collection
- Attorney and insurance information management

### 🩺 Visit Management
- **Initial Visits**: Comprehensive first-time patient assessments
- **Follow-up Visits**: Track patient progress and ongoing care
- **Discharge Visits**: Final visit documentation and discharge summaries
- Detailed visit history and documentation

### 📅 Appointment Scheduling
- Interactive calendar view
- Appointment creation and management
- Edit and update existing appointments

### 💰 Billing & Invoicing
- Invoice generation and management
- Billing list with detailed invoice information
- Print and export capabilities

### 📊 Reports & Analytics
- Unsettled case reports
- AI-powered narrative report generation
- Medical report PDF generation
- Dashboard with data visualization (Chart.js)

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router DOM** - Client-side routing
- **TanStack Query** - Data fetching and caching
- **React Hook Form** - Form management
- **Chart.js** - Data visualization
- **jsPDF** - PDF generation
- **Lucide React** - Icon library
- **React Toastify** - Toast notifications

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database (via Mongoose)
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Multer** - File upload handling
- **OpenAI API** - AI-powered report generation
- **Nodemailer** - Email functionality

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v20.x or higher)
- **npm** or **yarn**
- **MongoDB** (local instance or MongoDB Atlas account)
- **Git**

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd EMR-H
```

### 2. Install Dependencies

Install frontend dependencies:
```bash
npm install
```

Install backend dependencies:
```bash
cd server
npm install
cd ..
```

### 3. Environment Variables

Create a `.env` file in the `server` directory:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/wellness-studio-emr
# or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/wellness-studio-emr

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# OpenAI API Key (for AI report generation)
OPENAI_API_KEY=your-openai-api-key

# Server Port
PORT=5000

# Email Configuration (optional, for Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### 4. Run the Application

#### Development Mode

Run both frontend and backend concurrently:

```bash
npm run dev
```

Or run them separately:

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

#### Production Build

Build the frontend:
```bash
npm run build
```

Start the backend:
```bash
cd server
npm start
```

## 📁 Project Structure

```
EMR-H/
├── src/                    # Frontend source code
│   ├── components/        # Reusable React components
│   │   ├── layouts/      # Layout components
│   │   ├── AdminRoute.tsx
│   │   ├── DoctorRoute.tsx
│   │   └── PrivateRoute.tsx
│   ├── contexts/          # React contexts
│   │   └── AuthContext.tsx
│   ├── pages/             # Page components
│   │   ├── appointments/  # Appointment management
│   │   ├── auth/          # Authentication pages
│   │   ├── billing/       # Billing and invoicing
│   │   ├── dashboard/     # Dashboard
│   │   ├── patients/      # Patient management
│   │   ├── reports/       # Reports
│   │   └── visits/        # Visit management
│   ├── App.tsx            # Main app component
│   └── main.tsx           # Entry point
│
├── server/                # Backend source code
│   ├── middleware/        # Express middleware
│   │   └── authMiddleware.js
│   ├── models/            # MongoDB models
│   │   ├── Appointment.js
│   │   ├── Billing.js
│   │   ├── Counter.js
│   │   ├── Patient.js
│   │   ├── User.js
│   │   └── Visit.js
│   ├── routes/            # API routes
│   │   ├── aiRoutes.js
│   │   ├── appointments.js
│   │   ├── auth.js
│   │   ├── billing.js
│   │   ├── patients.js
│   │   ├── reports.js
│   │   └── visits.js
│   ├── uploads/           # Uploaded files
│   └── index.js           # Server entry point
│
├── dist/                  # Production build output
├── package.json           # Frontend dependencies
├── vite.config.ts         # Vite configuration
├── tailwind.config.js     # Tailwind CSS configuration
└── tsconfig.json          # TypeScript configuration
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Patients
- `GET /api/patients` - Get all patients
- `GET /api/patients/:id` - Get patient by ID
- `POST /api/patients` - Create new patient
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient

### Visits
- `GET /api/visits` - Get all visits
- `GET /api/visits/:id` - Get visit by ID
- `POST /api/visits` - Create new visit
- `PUT /api/visits/:id` - Update visit
- `DELETE /api/visits/:id` - Delete visit

### Appointments
- `GET /api/appointments` - Get all appointments
- `GET /api/appointments/:id` - Get appointment by ID
- `POST /api/appointments` - Create new appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Delete appointment

### Billing
- `GET /api/billing` - Get all invoices
- `GET /api/billing/:id` - Get invoice by ID
- `POST /api/billing` - Create new invoice
- `PUT /api/billing/:id` - Update invoice
- `DELETE /api/billing/:id` - Delete invoice

### Reports
- `GET /api/reports` - Get all reports
- `POST /api/reports/generate` - Generate medical report
- `POST /api/ai/generate-narrative` - Generate AI narrative report

### Health Check
- `GET /api/health` - Server health status

> **Note**: Most endpoints require authentication via JWT token in the `Authorization` header.

## 🔒 Security Features

- Password hashing with bcryptjs
- JWT token-based authentication
- Protected API routes with middleware
- Role-based access control (RBAC)
- CORS configuration for allowed origins
- Input validation and sanitization

## 🎨 UI/UX Features

- Responsive design with Tailwind CSS
- Modern and intuitive user interface
- Toast notifications for user feedback
- Modal dialogs for forms and confirmations
- Date pickers for appointment scheduling
- Interactive calendar view
- PDF export functionality
- Print-friendly invoice layouts

## 🤖 AI Integration

The system includes AI-powered features for:
- **Narrative Report Generation**: Automatically generates comprehensive narrative reports from visit data using OpenAI API
- **Medical Report Enhancement**: AI-assisted medical documentation

## 📝 Scripts

### Frontend Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Backend Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

## 🧪 Development

### Code Quality
- ESLint for code linting
- TypeScript for type safety
- Consistent code formatting

### Best Practices
- Component-based architecture
- Separation of concerns (frontend/backend)
- RESTful API design
- Error handling and validation
- Environment-based configuration

## 🚢 Deployment

### Frontend (Vercel/Netlify)
1. Build the project: `npm run build`
2. Deploy the `dist` folder to your hosting platform
3. Configure environment variables if needed

### Backend (Heroku/Railway/Render)
1. Set up MongoDB Atlas or use provided database
2. Configure environment variables
3. Deploy the `server` folder
4. Ensure CORS is configured for your frontend domain

## 📄 License

MIT License - see LICENSE file for details

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For support, please open an issue in the repository or contact the development team.

## 🙏 Acknowledgments

- Built with modern web technologies
- Uses OpenAI for AI-powered features
- Icons provided by Lucide React
- Charts powered by Chart.js

---

**Made with ❤️ for healthcare providers**

