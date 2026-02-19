import * as ShadcnUI from "@/client-integrations/shadcn-ui";
import React from "react";

function MainComponent() {
	const [currentTime, setCurrentTime] = React.useState(new Date());

	React.useEffect(() => {
		const timer = setInterval(() => {
			setCurrentTime(new Date());
		}, 1000);

		return () => clearInterval(timer);
	}, []);

	const [featuredItems, setFeaturedItems] = React.useState([
		{
			id: 1,
			name: "Summer Collection Tee",
			price: "$29.99",
			image:
				"https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
		},
		{
			id: 2,
			name: "Classic Denim Jacket",
			price: "$89.99",
			image:
				"https://images.unsplash.com/photo-1551537482-f2075a1d41f2?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
		},
		{
			id: 3,
			name: "Urban Streetwear Hoodie",
			price: "$49.99",
			image:
				"https://images.unsplash.com/photo-1556821840-3a63f95609a7?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
		},
	]);

	const [email, setEmail] = React.useState("");

	const handleSubscribe = () => {
		if (email) {
			// In a real app, this would connect to a backend
			alert(`Thanks for subscribing with ${email}!`);
			setEmail("");
		}
	};

	return (
		<div className="min-h-screen bg-[#f8f9fa]">
			{/* Navigation */}
			<header className="bg-white shadow-sm">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between h-16 items-center">
						<div className="flex-shrink-0 flex items-center">
							<h1 className="text-2xl font-bold text-[#333]">STYLIQUE</h1>
						</div>
						<nav className="hidden md:flex space-x-8">
							<a href="#" className="text-gray-600 hover:text-gray-900">
								Home
							</a>
							<a href="#" className="text-gray-600 hover:text-gray-900">
								Shop
							</a>
							<a href="#" className="text-gray-600 hover:text-gray-900">
								Collections
							</a>
							<a href="#" className="text-gray-600 hover:text-gray-900">
								About
							</a>
						</nav>
						<div className="flex items-center space-x-4">
							<ShadcnUI.Button variant="ghost" size="sm">
								<i className="fa fa-search mr-1"></i> Search
							</ShadcnUI.Button>
							<ShadcnUI.Button variant="ghost" size="sm">
								<i className="fa fa-user mr-1"></i> Account
							</ShadcnUI.Button>
							<ShadcnUI.Button variant="outline" size="sm">
								<i className="fa fa-shopping-bag mr-1"></i> Cart (0)
							</ShadcnUI.Button>
						</div>
					</div>
				</div>
			</header>

			{/* Hero Section */}
			<div className="relative bg-[#1a1a1a] text-white">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
					<div className="md:w-2/3">
						<h2 className="text-4xl md:text-5xl font-bold mb-6">
							Summer Collection 2025
						</h2>
						<p className="text-lg md:text-xl mb-8 text-gray-300">
							Discover the latest trends in fashion and explore our new
							collection of premium clothing designed for comfort and style.
						</p>
						<div className="flex flex-col sm:flex-row gap-4">
							<ShadcnUI.Button size="lg">Shop Now</ShadcnUI.Button>
							<ShadcnUI.Button variant="outline" size="lg">
								View Lookbook
							</ShadcnUI.Button>
						</div>
					</div>
				</div>
			</div>

			{/* Featured Products */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
				<div className="text-center mb-12">
					<h3 className="text-3xl font-bold text-gray-900 mb-4">
						Featured Products
					</h3>
					<p className="text-gray-600 max-w-2xl mx-auto">
						Our most popular items, handpicked for quality and style.
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					{featuredItems.map((item) => (
						<div
							key={item.id}
							className="bg-white rounded-lg overflow-hidden shadow-md transition-transform duration-300 hover:shadow-lg hover:-translate-y-1"
						>
							<div className="h-64 overflow-hidden">
								<img
									src={item.image}
									alt={item.name}
									className="w-full h-full object-cover"
								/>
							</div>
							<div className="p-6">
								<h4 className="text-lg font-semibold mb-2">{item.name}</h4>
								<p className="text-gray-700 mb-4">{item.price}</p>
								<ShadcnUI.Button variant="outline" className="w-full">
									Add to Cart
								</ShadcnUI.Button>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Newsletter */}
			<div className="bg-[#f0f0f0] py-16">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center mb-8">
						<h3 className="text-2xl font-bold text-gray-900 mb-2">
							Subscribe to Our Newsletter
						</h3>
						<p className="text-gray-600">
							Get updates on new arrivals and special promotions.
						</p>
					</div>
					<div className="max-w-md mx-auto flex flex-col sm:flex-row gap-2">
						<ShadcnUI.Input
							type="email"
							placeholder="Enter your email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="flex-grow"
						/>
						<ShadcnUI.Button onClick={handleSubscribe}>
							Subscribe
						</ShadcnUI.Button>
					</div>
				</div>
			</div>

			{/* Footer */}
			<footer className="bg-[#1a1a1a] text-white py-12">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="grid grid-cols-1 md:grid-cols-4 gap-8">
						<div>
							<h4 className="text-lg font-semibold mb-4">STYLIQUE</h4>
							<p className="text-gray-400">
								Premium clothing for the modern lifestyle.
							</p>
						</div>
						<div>
							<h4 className="text-lg font-semibold mb-4">Shop</h4>
							<ul className="space-y-2 text-gray-400">
								<li>
									<a href="#" className="hover:text-white">
										New Arrivals
									</a>
								</li>
								<li>
									<a href="#" className="hover:text-white">
										Best Sellers
									</a>
								</li>
								<li>
									<a href="#" className="hover:text-white">
										Sale
									</a>
								</li>
								<li>
									<a href="#" className="hover:text-white">
										Collections
									</a>
								</li>
							</ul>
						</div>
						<div>
							<h4 className="text-lg font-semibold mb-4">Help</h4>
							<ul className="space-y-2 text-gray-400">
								<li>
									<a href="#" className="hover:text-white">
										FAQ
									</a>
								</li>
								<li>
									<a href="#" className="hover:text-white">
										Shipping
									</a>
								</li>
								<li>
									<a href="#" className="hover:text-white">
										Returns
									</a>
								</li>
								<li>
									<a href="#" className="hover:text-white">
										Contact Us
									</a>
								</li>
							</ul>
						</div>
						<div>
							<h4 className="text-lg font-semibold mb-4">Connect</h4>
							<div className="flex space-x-4 text-xl mb-4">
								<a href="#" className="hover:text-white">
									<i className="fa fa-instagram"></i>
								</a>
								<a href="#" className="hover:text-white">
									<i className="fa fa-facebook"></i>
								</a>
								<a href="#" className="hover:text-white">
									<i className="fa fa-twitter"></i>
								</a>
								<a href="#" className="hover:text-white">
									<i className="fa fa-pinterest"></i>
								</a>
							</div>
							<ShadcnUI.CustomTooltip content="We accept all major credit cards">
								<div className="text-gray-400">
									<i className="fa fa-cc-visa mr-2"></i>
									<i className="fa fa-cc-mastercard mr-2"></i>
									<i className="fa fa-cc-amex mr-2"></i>
									<i className="fa fa-cc-paypal"></i>
								</div>
							</ShadcnUI.CustomTooltip>
						</div>
					</div>
					<div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
						<p>&copy; 2025 STYLIQUE. All rights reserved.</p>
					</div>
				</div>
			</footer>
		</div>
	);
}

export default MainComponent;
