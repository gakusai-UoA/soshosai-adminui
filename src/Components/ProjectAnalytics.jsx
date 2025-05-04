import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import Cookies from 'js-cookie';

function ProjectAnalytics() {
    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [hasAccess, setHasAccess] = useState(false);
    const [accessLogs, setAccessLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [analytics, setAnalytics] = useState({
        totalAccesses: 0,
        uniqueIPs: 0,
        accessesByHour: {},
    });

    const checkAccess = (projectData) => {
        const currentUserId = Cookies.get('staffId');
        return projectData.adminUserId === null || 
               projectData.adminUserId === 'all' || 
               projectData.adminUserId === currentUserId;
    };

    useEffect(() => {
        fetchProjectData();
    }, [id]);

    const fetchProjectData = async () => {
        try {
            // プロジェクト情報の取得
            const projectResponse = await fetch(`https://api.100ticket.soshosai.com/projects/${id}`);
            if (!projectResponse.ok) throw new Error('プロジェクトの取得に失敗しました');
            const projectData = await projectResponse.json();
            
            if (!checkAccess(projectData)) {
                throw new Error('このプロジェクトにアクセスする権限がありません');
            }

            setProject(projectData);
            setHasAccess(true);

            // アクセスログの取得
            const logsResponse = await fetch(`https://api.100ticket.soshosai.com/projects/${id}/getAccessLogs`);
            if (!logsResponse.ok) throw new Error('アクセスログの取得に失敗しました');
            const logsData = await logsResponse.json();
            setAccessLogs(logsData);

            // アナリティクスデータの計算
            calculateAnalytics(logsData);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const calculateAnalytics = (logs) => {
        const uniqueIPs = new Set(logs.map(log => log.ipAddress));
        const hourCounts = {};

        logs.forEach(log => {
            const hour = new Date(log.timestamp).getHours();
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });

        setAnalytics({
            totalAccesses: logs.length,
            uniqueIPs: uniqueIPs.size,
            accessesByHour: hourCounts,
        });
    };

    if (loading) return (
        <div className="flex justify-center items-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
    );

    if (!hasAccess) return (
        <div className="container mx-auto px-4 py-8">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                このプロジェクトにアクセスする権限がありません
            </div>
        </div>
    );

    if (error) return (
        <div className="container mx-auto px-4 py-8">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
            </div>
        </div>
    );

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">プロジェクト分析</h1>

            {project && (
                <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
                    <h2 className="text-xl font-semibold mb-4">{project.name}</h2>
                    <p className="text-gray-600 mb-4">
                        リダイレクト先: <a href={project.destination_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{project.destination_url}</a>
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white shadow-md rounded px-6 py-4">
                    <h3 className="text-lg font-semibold mb-2">総アクセス数</h3>
                    <p className="text-3xl font-bold text-blue-600">{analytics.totalAccesses}</p>
                </div>
                <div className="bg-white shadow-md rounded px-6 py-4">
                    <h3 className="text-lg font-semibold mb-2">ユニークIP数</h3>
                    <p className="text-3xl font-bold text-green-600">{analytics.uniqueIPs}</p>
                </div>
                <div className="bg-white shadow-md rounded px-6 py-4">
                    <h3 className="text-lg font-semibold mb-2">平均アクセス/IP</h3>
                    <p className="text-3xl font-bold text-purple-600">
                        {analytics.uniqueIPs ? (analytics.totalAccesses / analytics.uniqueIPs).toFixed(1) : 0}
                    </p>
                </div>
            </div>

            <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
                <h2 className="text-xl font-semibold mb-4">時間帯別アクセス数</h2>
                <div className="h-64">
                    <div className="flex h-full items-end">
                        {Array.from({ length: 24 }).map((_, hour) => (
                            <div
                                key={hour}
                                className="flex-1 bg-blue-500 mx-1 transition-all duration-300 hover:bg-blue-600"
                                style={{
                                    height: `${((analytics.accessesByHour[hour] || 0) / analytics.totalAccesses) * 100}%`,
                                    minHeight: analytics.accessesByHour[hour] ? '1px' : '0'
                                }}
                            >
                                <div className="text-xs text-center text-white">
                                    {analytics.accessesByHour[hour] || 0}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-2 text-sm text-gray-600">
                        <span>0時</span>
                        <span>6時</span>
                        <span>12時</span>
                        <span>18時</span>
                        <span>24時</span>
                    </div>
                </div>
            </div>

            <div className="bg-white shadow-md rounded px-8 pt-6 pb-8">
                <h2 className="text-xl font-semibold mb-4">最近のアクセスログ</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full table-auto">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="px-4 py-2">アクセス日時</th>
                                <th className="px-4 py-2">IPアドレス</th>
                                <th className="px-4 py-2">QR ID</th>
                            </tr>
                        </thead>
                        <tbody>
                            {accessLogs.map((log, index) => (
                                <tr key={index} className="border-b">
                                    <td className="px-4 py-2">{new Date(log.timestamp).toLocaleString('ja-JP')}</td>
                                    <td className="px-4 py-2">{log.ipAddress}</td>
                                    <td className="px-4 py-2">{log.qrId}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default ProjectAnalytics;
