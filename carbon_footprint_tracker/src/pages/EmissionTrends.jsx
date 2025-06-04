import { useEffect, useState } from 'react';
import { Line, Bar } from 'react-chartjs-2'; // Import Bar chart
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement, // Import BarElement
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import zoomPlugin from 'chartjs-plugin-zoom';
import '../styles/EmissionTrends.css';

import { auth, db } from '../firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement, // Register BarElement
  Title,
  Tooltip,
  Legend,
  ChartDataLabels,
  zoomPlugin
);

// Function to parse Firestore Timestamps to JS Date objects
function parseFirestoreTimestamp(dateValue) {
  if (typeof dateValue === 'object' && dateValue !== null && typeof dateValue.toDate === 'function') {
    const jsDate = dateValue.toDate();
    if (!isNaN(jsDate.getTime())) {
      return jsDate;
    }
  }
  // Fallback for unexpected formats (though primarily expecting Timestamps)
  if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
    return dateValue;
  }
  console.warn("parseFirestoreTimestamp: Could not parse date value:", dateValue);
  return null;
}

export default function EmissionTrends() {
  const [logs, setLogs] = useState([]);
  const [view, setView] = useState('weekly');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [activityBreakdown, setActivityBreakdown] = useState({}); // New state for activity breakdown

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setLogs([]);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch logs when user changes
  useEffect(() => {
    const fetchCarbonLogs = async (uid) => {
      if (!uid) {
        setLogs([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const logsCollectionRef = collection(db, "users", uid, "carbonLogs");
        const q = query(logsCollectionRef, orderBy('date', 'asc'));
        const querySnapshot = await getDocs(q);

        const fetchedLogs = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            date: parseFirestoreTimestamp(data.date), // Use the dedicated parser
            emission: data.emission || 0,
            activity: data.activity || 'Unknown',
          };
        }).filter(log => log.date !== null); // Filter out any logs with invalid dates

        setLogs(fetchedLogs);

        // Calculate activity breakdown
        const breakdown = fetchedLogs.reduce((acc, log) => {
          acc[log.activity] = (acc[log.activity] || 0) + log.emission;
          return acc;
        }, {});
        setActivityBreakdown(breakdown);

        if (fetchedLogs.length === 0 && !error) {
          setError("No emission data found for this user. Start logging activities to see trends!");
        }

      } catch (err) {
        console.error("Error fetching carbon logs:", err);
        setError("Failed to load emission data. Please check your internet connection or try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchCarbonLogs(user.uid);
    }
  }, [user]);

  // Helper for date formatting
  const localISODate = (date) =>
    date.getFullYear() +
    '-' +
    String(date.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(date.getDate()).padStart(2, '0');

  const groupEmissions = (interval) => {
    const map = new Map();
    const now = new Date();

    logs.forEach((log) => {
      const date = log.date;
      if (!date) return;

      let key;
      if (interval === 'weekly') {
        const startOfYear = new Date(date.getFullYear(), 0, 1);
        const diff = date - startOfYear;
        const oneWeek = 1000 * 60 * 60 * 24 * 7;
        key = `Week ${Math.ceil(diff / oneWeek)}`;
      } else if (interval === 'monthly') {
        key = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      } else if (interval === 'daily') {
        key = localISODate(date);
      }
      map.set(key, (map.get(key) || 0) + log.emission);
    });

    let labels = [...map.keys()];
    let data = [...map.values()];

    // Sorting logic (can be made more robust for multi-year data)
    if (interval === 'daily') {
      const sorted = labels
        .map((label, i) => ({ label, value: data[i] }))
        .sort((a, b) => new Date(a.label) - new Date(b.label));
      labels = sorted.map((item) => item.label);
      data = sorted.map((item) => item.value);
    } else if (interval === 'monthly') {
        const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const sorted = labels
            .map((label, i) => ({ label, value: data[i] }))
            .sort((a, b) => {
                const [aMonth, aYear] = a.label.split(' ');
                const [bMonth, bYear] = b.label.split(' ');
                if (aYear !== bYear) {
                    return parseInt(aYear) - parseInt(bYear);
                }
                return monthOrder.indexOf(aMonth) - monthOrder.indexOf(bMonth);
            });
        labels = sorted.map(item => item.label);
        data = sorted.map(item => item.value);
    } else if (interval === 'weekly') {
        // More robust weekly sorting considering year boundaries
        const sorted = labels
            .map((label, i) => ({ label, value: data[i] }))
            .sort((a, b) => {
                const yearA = new Date(logs.find(log => `Week ${Math.ceil((log.date - new Date(log.date.getFullYear(), 0, 1)) / (1000 * 60 * 60 * 24 * 7))}` === a.label)?.date?.getFullYear() || now.getFullYear());
                const weekNumA = parseInt(a.label.replace('Week ', ''));

                const yearB = new Date(logs.find(log => `Week ${Math.ceil((log.date - new Date(log.date.getFullYear(), 0, 1)) / (1000 * 60 * 60 * 24 * 7))}` === b.label)?.date?.getFullYear() || now.getFullYear());
                const weekNumB = parseInt(b.label.replace('Week ', ''));

                if (yearA !== yearB) return yearA - yearB;
                return weekNumA - weekNumB;
            });
        labels = sorted.map(item => item.label);
        data = sorted.map(item => item.value);
    }

    const formattedLabels =
      interval === 'daily'
        ? labels.map((dateStr) => {
            const date = new Date(dateStr);
            return date.toLocaleDateString('default', { day: 'numeric', month: 'short' });
          })
        : labels;

    return { labels: formattedLabels, data };
  };

  const { labels, data } = groupEmissions(view);

  const chartData = {
    labels,
    datasets: [
      {
        label: `Carbon Footprint (${view} kg CO₂)`,
        data,
        borderColor: '#3b82f6',
        backgroundColor: '#93c5fd',
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const activityChartData = {
    labels: Object.keys(activityBreakdown),
    datasets: [
      {
        label: 'Emissions by Activity (kg CO₂)',
        data: Object.values(activityBreakdown),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(199, 199, 199, 0.6)',
          'rgba(83, 102, 255, 0.6)',
          'rgba(200, 50, 100, 0.6)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(199, 199, 199, 1)',
          'rgba(83, 102, 255, 1)',
          'rgba(200, 50, 100, 1)'
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false, // Allows flexible sizing
    plugins: {
      datalabels: {
        color: '#fff',
        font: {
          weight: 'bold',
          size: 10, // Smaller font for labels
        },
        formatter: (value) => value > 0 ? `${value.toFixed(2)} kg` : null, // Only show if > 0
        display: (context) => context.dataset.data[context.dataIndex] > 0, // Only display labels for values > 0
      },
      zoom: {
        pan: {
          enabled: true,
          mode: 'xy',
        },
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true
          },
          mode: 'xy',
          speed: 0.1,
        },
      },
      title: {
        display: true,
        text: `Carbon Emission Trends (${view.charAt(0).toUpperCase() + view.slice(1)})`,
        font: { size: 18, weight: 'bold' },
        color: '#333',
      },
      legend: {
        display: true,
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += `${context.parsed.y.toFixed(2)} kg CO₂`;
            }
            return label;
          }
        }
      }
    },
    scales: {
        x: {
            title: {
                display: true,
                text: view === 'daily' ? 'Date' : view === 'weekly' ? 'Week' : 'Month',
                color: '#555',
                font: { size: 14, weight: 'bold' }
            },
            grid: {
                display: false
            }
        },
        y: {
            title: {
                display: true,
                text: 'Carbon Footprint (kg CO₂)',
                color: '#555',
                font: { size: 14, weight: 'bold' }
            },
            beginAtZero: true,
            grid: {
                color: 'rgba(0, 0, 0, 0.05)'
            }
        }
    }
  };

  const activityChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      datalabels: {
        color: '#fff',
        font: {
          weight: 'bold',
          size: 10,
        },
        formatter: (value) => value > 0 ? `${value.toFixed(2)} kg` : null,
        display: (context) => context.dataset.data[context.dataIndex] > 0,
      },
      title: {
        display: true,
        text: 'Emissions by Activity Type',
        font: { size: 18, weight: 'bold' },
        color: '#333',
      },
      legend: {
        display: false, // Hide legend for bar chart if labels are on bars
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += `${context.parsed.y.toFixed(2)} kg CO₂`;
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Activity Type',
          color: '#555',
          font: { size: 14, weight: 'bold' }
        },
        grid: {
            display: false
        }
      },
      y: {
        title: {
          display: true,
          text: 'Total Carbon Footprint (kg CO₂)',
          color: '#555',
          font: { size: 14, weight: 'bold' }
        },
        beginAtZero: true,
        grid: {
            color: 'rgba(0, 0, 0, 0.05)'
        }
      }
    }
  };

  const exportData = () => {
    if (logs.length === 0) {
      alert("No data to export!");
      return;
    }

    const headers = ["Activity", "Emission (kg CO₂e)", "Date"];
    const csvRows = logs.map(log => {
      const dateString = log.date ? log.date.toISOString().split('T')[0] : 'N/A';
      return [log.activity, log.emission.toFixed(2), dateString].join(',');
    });

    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'carbon_logs.csv');
    link.click();
    URL.revokeObjectURL(url);
  };


  if (loading) {
    return <div className="emission-container loading-state"><p>Loading your emission insights...</p></div>;
  }

  if (error) {
    return <div className="emission-container error-state"><p className="error-message">{error}</p></div>;
  }

  if (!user) {
    return (
      <div className="emission-container no-user-message-trends">
        <p>Please log in to view your detailed emission trends and insights.</p>
      </div>
    );
  }

  return (
    <div className="emission-container">
      <div className="header">
        <h1 className="emission-title">Your Emission Insights</h1>
        <div className="view-toggle">
          <button className={view === 'daily' ? 'active' : ''} onClick={() => setView('daily')} aria-pressed={view === 'daily'}>
            Daily
          </button>
          <button className={view === 'weekly' ? 'active' : ''} onClick={() => setView('weekly')} aria-pressed={view === 'weekly'}>
            Weekly
          </button>
          <button className={view === 'monthly' ? 'active' : ''} onClick={() => setView('monthly')} aria-pressed={view === 'monthly'}>
            Monthly
          </button>
        </div>
      </div>

      {logs.length > 0 ? (
        <>
          <div className="chart-section line-chart">
            <Line data={chartData} options={chartOptions} />
            <p className="chart-description">This chart shows your total carbon footprint over time, grouped by {view}.</p>
          </div>

          <div className="chart-section bar-chart">
            <Bar data={activityChartData} options={activityChartOptions} />
            <p className="chart-description">This bar chart breaks down your total emissions by activity type, helping you identify your largest contributors.</p>
          </div>

          <div className="trends-actions">
            <button onClick={exportData} className="export-button">
              Export All Data (CSV)
            </button>
            {/* Reset Zoom Button */}
            <button
                onClick={() => ChartJS.getChart('myLineChart')?.resetZoom()} // Assuming chart ID 'myLineChart'
                className="reset-zoom-button"
            >
                Reset Chart Zoom
            </button>
            {/* To reset Bar chart zoom, if Bar chart also supports it */}
            <button
                onClick={() => ChartJS.getChart('myBarChart')?.resetZoom()} // Assuming chart ID 'myBarChart'
                className="reset-zoom-button"
            >
                Reset Bar Chart Zoom
            </button>
          </div>
        </>
      ) : (
        <p className="no-data-message">No emission data available. Start logging your activities to see detailed trends!</p>
      )}

      {/* Adding more insights here as needed */}
      <div className="section insights-summary">
        <h3>Quick Insights</h3>
        {logs.length > 0 ? (
          <>
            <p>Your total logged emission: <strong>{logs.reduce((sum, log) => sum + log.emission, 0).toFixed(2)} kg CO₂</strong></p>
            <p>Most common activity: <strong>{Object.entries(activityBreakdown).sort((a,b) => b[1] - a[1])[0]?.[0] || 'N/A'}</strong></p>
            {/* Add more insights like average daily, weekly, monthly if desired */}
          </>
        ) : (
          <p>Log more data to unlock deeper insights!</p>
        )}
      </div>

    </div>
  );
}