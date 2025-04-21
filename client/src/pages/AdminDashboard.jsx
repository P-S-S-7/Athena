import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ToastContainer, showSuccessToast } from '@/utils/toast';
import Sidebar from '../utils/Sidebar';
import Header from '../utils/Header';
import { useAuth } from '../contexts/AuthContext';
import ticketService from '@/services/ticketService';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    CalendarIcon,
    Clock,
    BarChart2,
    AlertTriangle,
    CheckCircle,
    MessageSquare,
    Plus,
    Mail,
    User,
    Users
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useData } from "@/contexts/DataContext";

const AdminDashboard = () => {
    const location = useLocation();
    const { user } = useAuth();
    const [isProfileLoaded, setIsProfileLoaded] = useState(false);
    const { groupMap } = useData();
    const [dashboardData, setDashboardData] = useState({
        ticketStats: {
            unresolved: 0,
            overdue: 0,
            dueToday: 0,
            open: 0,
            onHold: 0,
            unassigned: 0
        },
        trendsData: [],
        unresolvedByGroup: [],
        customerSatisfaction: {
            responses: 0,
            positive: 0,
            neutral: 0,
            negative: 0
        },
        emailDelivery: {
            pending: 0,
            failed: 0
        },
        loading: true
    });

    const showWelcome = new URLSearchParams(location.search).get("welcome") === 'true';

    useEffect(() => {
        if (user) {
            setIsProfileLoaded(true);
        }
    }, [user]);

    useEffect(() => {
        if (isProfileLoaded && showWelcome) {
            const hasShownWelcome = sessionStorage.getItem('welcomeShown');

            if (!hasShownWelcome) {
                setTimeout(() => {
                    showSuccessToast(`Welcome, ${user.full_name || "Admin"}! You've successfully signed in.`);
                }, 500);

                sessionStorage.setItem('welcomeShown', 'true');

                const newUrl = window.location.pathname;
                window.history.replaceState({}, document.title, newUrl);
            }
        }
    }, [isProfileLoaded, showWelcome, user]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await ticketService.getTickets();
                const tickets = response.tickets;

                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

                const unresolvedCount = tickets.filter(ticket => ticket.status !== 4 && ticket.status !== 5).length;
                const overdueCount = tickets.filter(ticket =>
                    new Date(ticket.due_by) < now && ticket.status !== 4 && ticket.status !== 5
                ).length;
                const dueTodayCount = tickets.filter(ticket => {
                    const dueDate = new Date(ticket.due_by);
                    return dueDate >= today &&
                           dueDate < new Date(today.getTime() + 24 * 60 * 60 * 1000) &&
                           ticket.status !== 4 &&
                           ticket.status !== 5;
                }).length;
                const openCount = tickets.filter(ticket => ticket.status === 2).length;
                const onHoldCount = tickets.filter(ticket => ticket.status === 3).length;
                const unassignedCount = tickets.filter(ticket => ticket.responder_id === null && ticket.status !== 5 && ticket.group_id === null).length;

                const totalResponses = 150;
                const positivePercentage = 80;
                const neutralPercentage = 15;
                const negativePercentage = 5;

                const trendsData = [
                    { name: '6 AM', resolved: 2, received: 3 },
                    { name: '8 AM', resolved: 4, received: 6 },
                    { name: '10 AM', resolved: 5, received: 4 },
                    { name: '12 PM', resolved: 3, received: 5 },
                    { name: '2 PM', resolved: 6, received: 7 },
                    { name: '4 PM', resolved: 4, received: 6 },
                ];

                const groupCounts = {};
                const unresolvedByGroup = [];

                tickets.filter(ticket => ticket.status === 2).forEach(ticket => {
                    const groupId = ticket.group_id || 'unassigned';
                    if (!groupCounts[groupId]) {
                        groupCounts[groupId] = 0;
                    }
                    groupCounts[groupId]++;
                });

                for (const [groupId, count] of Object.entries(groupCounts)) {
                    unresolvedByGroup.push({
                        name: groupId === 'unassigned' ? 'Unassigned' : (groupMap[groupId] || `Group ${groupId}`),
                        count: count
                    });
                }

                setDashboardData({
                    ticketStats: {
                        unresolved: unresolvedCount,
                        overdue: overdueCount,
                        dueToday: dueTodayCount,
                        open: openCount,
                        onHold: onHoldCount,
                        unassigned: unassignedCount
                    },
                    trendsData,
                    unresolvedByGroup,
                    customerSatisfaction: {
                        responses: totalResponses,
                        positive: positivePercentage,
                        neutral: neutralPercentage,
                        negative: negativePercentage
                    },
                    emailDelivery: {
                        pending: 3,
                        failed: 1
                    },
                    loading: false
                });

            } catch (error) {
                console.error("Error fetching dashboard data:", error);
                setDashboardData(prev => ({ ...prev, loading: false }));
            }
        };

        if (user) {
            fetchDashboardData();
        }
    }, [user]);

    const StatCard = ({ title, value, icon: Icon }) => (
        <Card className="bg-white shadow hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-4 flex justify-between items-center">
                <div>
                    <p className="text-sm text-gray-500">{title}</p>
                    <p className="text-2xl font-bold">{value}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-full">
                    <Icon className="h-6 w-6 text-blue-500" />
                </div>
            </CardContent>
        </Card>
    );

    if (!user) return null;

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
            <Sidebar />

            <div className="flex flex-col flex-grow">
                <Header
                    title="Admin Dashboard"
                    userRole={user.role}
                    userEmail={user.email}
                    userFullName={user.full_name}
                    userAvatarUrl={user.avatar_url}
                >
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button className="ml-4">
                                <Plus className="mr-2 h-4 w-4" /> New
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem className="cursor-pointer">
                                <span className="mr-2">🎫</span> Ticket
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                                <span className="mr-2">✉️</span> Email
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                                <span className="mr-2">👤</span> Contact
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                                <span className="mr-2">👥</span> Agent
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </Header>

                <main className="flex-grow p-6 overflow-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold">Dashboard Overview</h1>
                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">Recent Activities</span>
                            <Button variant="ghost" size="sm">▼</Button>
                        </div>
                    </div>

                    {dashboardData.loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                                <StatCard
                                    title="Unresolved"
                                    value={dashboardData.ticketStats.unresolved}
                                    icon={AlertTriangle}
                                />
                                <StatCard
                                    title="Overdue"
                                    value={dashboardData.ticketStats.overdue}
                                    icon={Clock}
                                />
                                <StatCard
                                    title="Due Today"
                                    value={dashboardData.ticketStats.dueToday}
                                    icon={CalendarIcon}
                                />
                                <StatCard
                                    title="Open"
                                    value={dashboardData.ticketStats.open}
                                    icon={MessageSquare}
                                />
                                <StatCard
                                    title="On Hold"
                                    value={dashboardData.ticketStats.onHold}
                                    icon={Clock}
                                />
                                <StatCard
                                    title="Unassigned"
                                    value={dashboardData.ticketStats.unassigned}
                                    icon={Users}
                                />
                            </div>

                            <Card className="mb-6">
                                <CardHeader>
                                    <CardTitle>Today's Trends</CardTitle>
                                    <CardDescription>Hourly ticket activity for the day</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-4">
                                        <div className="col-span-3 h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={dashboardData.trendsData}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="name" />
                                                    <YAxis />
                                                    <Tooltip />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="resolved"
                                                        stroke="#22C55E"
                                                        activeDot={{ r: 8 }}
                                                        name="Resolved"
                                                    />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="received"
                                                        stroke="#3B82F6"
                                                        name="Received"
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="ml-4 space-y-4 flex flex-col justify-center">
                                            <div>
                                                <p className="text-sm text-gray-500">Resolved:</p>
                                                <p className="text-xl font-bold">24</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Received:</p>
                                                <p className="text-xl font-bold">31</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Avg First Response:</p>
                                                <p className="text-xl font-bold">2h</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Resolution SLA:</p>
                                                <p className="text-xl font-bold">95%</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Unresolved Tickets</CardTitle>
                                        <CardDescription>Across freshdesk</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div className="flex justify-between text-sm font-medium">
                                                <span>Group</span>
                                                <span>Open</span>
                                            </div>
                                            <div className="space-y-2">
                                                {dashboardData.unresolvedByGroup.map((group, index) => (
                                                    <div key={index} className="flex justify-between items-center">
                                                        <span className="text-sm">{group.name}</span>
                                                        <Badge variant="outline" className="font-mono">
                                                            [{group.count}]
                                                        </Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <Button variant="outline" size="sm" className="w-full">
                                            View Details
                                        </Button>
                                    </CardFooter>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Undelivered Emails</CardTitle>
                                        <CardDescription>Across freshdesk</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-col items-center justify-center h-40">
                                            <Mail className="h-16 w-16 text-gray-300 mb-4" />
                                            <p className="text-sm text-gray-500">
                                                {dashboardData.emailDelivery.pending + dashboardData.emailDelivery.failed === 0
                                                    ? "All emails delivered successfully"
                                                    : `${dashboardData.emailDelivery.pending} pending, ${dashboardData.emailDelivery.failed} failed`}
                                            </p>
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <Button variant="outline" size="sm" className="w-full">
                                            View Details
                                        </Button>
                                    </CardFooter>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Customer Satisfaction</CardTitle>
                                        <CardDescription>Across freshdesk</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-center mb-4">
                                            <p className="text-sm text-gray-500">Responses:</p>
                                            <p className="text-xl font-bold">{dashboardData.customerSatisfaction.responses}</p>
                                        </div>
                                        <div className="space-y-3">
                                            <div>
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-sm">Positive: {dashboardData.customerSatisfaction.positive}% 😊</span>
                                                </div>
                                                <Progress value={dashboardData.customerSatisfaction.positive} className="h-2 bg-gray-200">
                                                    <div className="h-full bg-green-500" style={{ width: `${dashboardData.customerSatisfaction.positive}%` }}></div>
                                                </Progress>
                                            </div>
                                            <div>
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-sm">Neutral: {dashboardData.customerSatisfaction.neutral}% 😐</span>
                                                </div>
                                                <Progress value={dashboardData.customerSatisfaction.neutral} className="h-2 bg-gray-200">
                                                    <div className="h-full bg-yellow-500" style={{ width: `${dashboardData.customerSatisfaction.neutral}%` }}></div>
                                                </Progress>
                                            </div>
                                            <div>
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-sm">Negative: {dashboardData.customerSatisfaction.negative}% ☹️</span>
                                                </div>
                                                <Progress value={dashboardData.customerSatisfaction.negative} className="h-2 bg-gray-200">
                                                    <div className="h-full bg-red-500" style={{ width: `${dashboardData.customerSatisfaction.negative}%` }}></div>
                                                </Progress>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <Button variant="outline" size="sm" className="w-full">
                                            View Details
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </div>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-lg">To-do</CardTitle>
                                    <Button variant="ghost" size="sm">
                                        <Plus className="h-4 w-4 mr-1" /> Add a to-do
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    <div className="border-t border-gray-200 pt-4">
                                        <div className="text-center py-8 text-gray-500">
                                            <p>To-dos List</p>
                                            <p className="text-sm">(No items yet)</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </main>
            </div>

            <ToastContainer />
        </div>
    );
};

export default AdminDashboard;
