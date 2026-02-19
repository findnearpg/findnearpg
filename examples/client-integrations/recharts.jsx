import React from "react";
import * as Recharts from "@/client-integrations/recharts";

function MainComponent() {
	const [currentTime, setCurrentTime] = React.useState(new Date());
	const [clickCount, setClickCount] = React.useState(0);

	// Sample data for the chart - representing clicks over the last 7 days
	const [clickData, setClickData] = React.useState([
		{ day: "Monday", clicks: 5 },
		{ day: "Tuesday", clicks: 8 },
		{ day: "Wednesday", clicks: 12 },
		{ day: "Thursday", clicks: 7 },
		{ day: "Friday", clicks: 15 },
		{ day: "Saturday", clicks: 3 },
		{ day: "Sunday", clicks: 9 },
	]);

	React.useEffect(() => {
		const timer = setInterval(() => {
			setCurrentTime(new Date());
		}, 1000);

		return () => clearInterval(timer);
	}, []);

	// Function to handle button clicks
	const handleClick = () => {
		setClickCount((prevCount) => prevCount + 1);

		// Update today's data in the chart
		const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
		setClickData((prevData) => {
			const newData = [...prevData];
			const todayIndex = newData.findIndex((item) => item.day === today);
			if (todayIndex !== -1) {
				newData[todayIndex] = {
					...newData[todayIndex],
					clicks: newData[todayIndex].clicks + 1,
				};
			}
			return newData;
		});
	};

	return (
		<div className="min-h-screen bg-gradient-to-b from-blue-100 to-purple-100 flex flex-col items-center justify-center p-4">
			<div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl w-full text-center mb-8">
				<h1 className="text-4xl font-bold text-blue-600 mb-4">Hello, World!</h1>
				<p className="text-gray-700 text-lg mb-6">
					Welcome to my first page created with Create.xyz
				</p>

				<div className="mb-6">
					<button
						type="button"
						onClick={handleClick}
						className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
					>
						Click Me!
					</button>
					<p className="mt-2 text-gray-600">
						You've clicked the button {clickCount} times in this session.
					</p>
				</div>

				<div className="mb-6 w-full h-64">
					<h2 className="text-xl font-semibold text-gray-700 mb-4">
						Click History (Last 7 Days)
					</h2>
					<Recharts.ResponsiveContainer width="100%" height="100%">
						<Recharts.BarChart
							data={clickData}
							margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
						>
							<Recharts.CartesianGrid strokeDasharray="3 3" />
							<Recharts.XAxis dataKey="day" />
							<Recharts.YAxis />
							<Recharts.Tooltip />
							<Recharts.Legend />
							<Recharts.Bar
								dataKey="clicks"
								fill="#8884d8"
								name="Button Clicks"
							/>
						</Recharts.BarChart>
					</Recharts.ResponsiveContainer>
				</div>

				<div className="text-sm text-gray-500">
					Current time: {currentTime.toLocaleTimeString()}
				</div>
				<div className="mt-8 p-4 bg-blue-50 rounded-md">
					<p className="text-gray-600">
						This page demonstrates React, Tailwind CSS styling, and Recharts for
						data visualization.
					</p>
				</div>
			</div>
		</div>
	);
}

export default MainComponent;
