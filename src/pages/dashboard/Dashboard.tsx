import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Activity
} from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    patientCount: 0,
    appointmentsToday: 0,
    appointmentsUpcoming: 0,
    overdueFollowups: 0
  });
  const [billingStats, setBillingStats] = useState({
    billedThisMonth: 0,
    collectedThisMonth: 0,
    outstanding: 0,
    statusCounts: {
      draft: 0,
      sent: 0,
      paid: 0,
      overdue: 0,
      partial: 0
    }
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [appointmentStats, setAppointmentStats] = useState({
    scheduled: 0,
    completed: 0,
    cancelled: 0,
    noShow: 0
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      
      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.warn('Dashboard data fetch timeout - setting default values');
        setStats({
          patientCount: 0,
          appointmentsToday: 0,
          appointmentsUpcoming: 0,
          overdueFollowups: 0
        });
        setBillingStats({
          billedThisMonth: 0,
          collectedThisMonth: 0,
          outstanding: 0,
          statusCounts: {
            draft: 0,
            sent: 0,
            paid: 0,
            overdue: 0,
            partial: 0
          }
        });
        setRecentAppointments([]);
        setAppointmentStats({
          scheduled: 0,
          completed: 0,
          cancelled: 0,
          noShow: 0
        });
        setIsLoading(false);
      }, 10000); // 10 second timeout
      
      try {
        // Get today's date
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0];
        const nextWeek = new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0];
        
        // Fetch all data in parallel for faster loading
        const [
          patientsResponse,
          todayAppointmentsResponse,
          upcomingAppointmentsResponse,
          billingSummaryResponse,
          recentAppointmentsResponse
        ] = await Promise.all([
          axios.get('https://emr-h.onrender.com/api/patients?limit=1'),
          axios.get(`https://emr-h.onrender.com/api/appointments?startDate=${today}&endDate=${tomorrow}`),
          axios.get(`https://emr-h.onrender.com/api/appointments?startDate=${tomorrow}&endDate=${nextWeek}`),
          axios.get('https://emr-h.onrender.com/api/billing/summary/dashboard'),
          axios.get('https://emr-h.onrender.com/api/appointments?limit=5')
        ]);
        
        // Clear timeout since we got the data
        clearTimeout(timeoutId);
        
        // Calculate appointment stats
        const allAppointments = [...todayAppointmentsResponse.data, ...upcomingAppointmentsResponse.data];
        const appointmentStatsCounts = {
          scheduled: allAppointments.filter(a => a.status === 'scheduled').length,
          completed: allAppointments.filter(a => a.status === 'completed').length,
          cancelled: allAppointments.filter(a => a.status === 'cancelled').length,
          noShow: allAppointments.filter(a => a.status === 'no-show').length
        };
        
        setStats({
          patientCount: patientsResponse.data.totalPatients || 0,
          appointmentsToday: todayAppointmentsResponse.data.length,
          appointmentsUpcoming: upcomingAppointmentsResponse.data.length,
          overdueFollowups: 0 // This would require additional logic to determine
        });
        
        setBillingStats(billingSummaryResponse.data);
        setRecentAppointments(recentAppointmentsResponse.data.slice(0, 5));
        setAppointmentStats(appointmentStatsCounts);
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        clearTimeout(timeoutId);
        
        // Set default values on error to prevent loading state from hanging
        setStats({
          patientCount: 0,
          appointmentsToday: 0,
          appointmentsUpcoming: 0,
          overdueFollowups: 0
        });
        setBillingStats({
          billedThisMonth: 0,
          collectedThisMonth: 0,
          outstanding: 0,
          statusCounts: {
            draft: 0,
            sent: 0,
            paid: 0,
            overdue: 0,
            partial: 0
          }
        });
        setRecentAppointments([]);
        setAppointmentStats({
          scheduled: 0,
          completed: 0,
          cancelled: 0,
          noShow: 0
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  // Chart data
  const appointmentChartData = {
    labels: ['Scheduled', 'Completed', 'Cancelled', 'No Show'],
    datasets: [
      {
        label: 'Appointments',
        data: [
          appointmentStats.scheduled,
          appointmentStats.completed,
          appointmentStats.cancelled,
          appointmentStats.noShow
        ],
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(255, 159, 64, 0.6)'
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 159, 64, 1)'
        ],
        borderWidth: 1,
      },
    ],
  };

  const billingChartData = {
    labels: ['Billed', 'Collected', 'Outstanding'],
    datasets: [
      {
        label: 'Amount ($)',
        data: [
          billingStats.billedThisMonth,
          billingStats.collectedThisMonth,
          billingStats.outstanding
        ],
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 99, 132, 0.6)'
        ],
      },
    ],
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-800">
              Welcome, {user?.firstName} {user?.lastName}
            </h1>
            <p className="text-gray-600">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-blue-500 mb-6"></div>
            <h2 className="text-2xl font-bold text-gray-700 mb-3">Loading Your Dashboard</h2>
            <p className="text-gray-500 text-center max-w-lg mb-8">
              Please wait while we fetch your latest data, appointments, patient information, and statistics...
            </p>
            
            {/* Loading skeleton for stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow-lg p-6 animate-pulse">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-gray-200">
                      <div className="h-6 w-6 bg-gray-300 rounded"></div>
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-8 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Loading skeleton for charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-6xl mt-12">
              <div className="bg-white rounded-lg shadow-lg p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-4 w-32"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
              <div className="bg-white rounded-lg shadow-lg p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-4 w-32"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-800">
          Welcome, {user?.firstName} {user?.lastName}
        </h1>
        <p className="text-gray-600">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <Users className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500 font-medium">Total Patients</p>
              <p className="text-2xl font-semibold text-gray-800">{stats.patientCount}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/patients" className="text-sm text-blue-600 hover:text-blue-800">
              View all patients →
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <Calendar className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500 font-medium">Today's Appointments</p>
              <p className="text-2xl font-semibold text-gray-800">{stats.appointmentsToday}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/appointments" className="text-sm text-green-600 hover:text-green-800">
              View schedule →
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <Clock className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500 font-medium">Upcoming Appointments</p>
              <p className="text-2xl font-semibold text-gray-800">{stats.appointmentsUpcoming}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/appointments" className="text-sm text-purple-600 hover:text-purple-800">
              View upcoming →
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <DollarSign className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500 font-medium">Outstanding Balance</p>
              <p className="text-2xl font-semibold text-gray-800">${billingStats.outstanding.toFixed(2)}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/billing" className="text-sm text-yellow-600 hover:text-yellow-800">
              View billing →
            </Link>
          </div>
        </div>
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Appointment Status Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Appointment Status</h2>
          <div className="h-64">
            <Doughnut 
              data={appointmentChartData} 
              options={{
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                },
              }} 
            />
          </div>
        </div>

        {/* Billing Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Monthly Billing Overview</h2>
          <div className="h-64">
            <Bar 
              data={billingChartData} 
              options={{
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                  },
                },
              }} 
            />
          </div>
        </div>
      </div>

      {/* Recent Appointments */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Recent Appointments</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentAppointments.length > 0 ? (
                recentAppointments.map((appointment: any) => (
                  <tr key={appointment._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
  {appointment.patient?.firstName && appointment.patient?.lastName
    ? `${appointment.patient.firstName} ${appointment.patient.lastName}`
    : 'Unknown Patient'}
</div>

                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(appointment.date).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {appointment.time.start} - {appointment.time.end}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 capitalize">
                        {appointment.type}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${appointment.status === 'completed' ? 'bg-green-100 text-green-800' : 
                          appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' : 
                          appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                          'bg-yellow-100 text-yellow-800'}`}>
                        {appointment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <Link to={`/appointments/${appointment._id}/edit`} className="text-blue-600 hover:text-blue-900 mr-3">
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    No recent appointments
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-gray-200">
          <Link to="/appointments" className="text-sm text-blue-600 hover:text-blue-800">
            View all appointments →
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/patients/new"
            className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Users className="h-6 w-6 text-blue-600 mr-3" />
            <span className="text-blue-700 font-medium">Add New Patient</span>
          </Link>
          <Link
            to="/appointments/new"
            className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <Calendar className="h-6 w-6 text-green-600 mr-3" />
            <span className="text-green-700 font-medium">Schedule Appointment</span>
          </Link>
          <Link
            to="/billing/new"
            className="flex items-center p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
          >
            <DollarSign className="h-6 w-6 text-yellow-600 mr-3" />
            <span className="text-yellow-700 font-medium">Create Invoice</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;