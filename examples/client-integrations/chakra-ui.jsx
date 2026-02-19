import * as ChakraUI from "@/client-integrations/chakra-ui";
import { useState } from "react";

function MainComponent() {
	const [workoutCount, setWorkoutCount] = useState(0);

	return (
		<ChakraUI.ChakraProvider>
			<ChakraUI.Box minHeight="100vh" bg="green.50">
				<ChakraUI.Flex
					direction="column"
					align="center"
					maxW="1200px"
					mx="auto"
					px={4}
					py={8}
				>
					{/* Header */}
					<ChakraUI.Box as="header" width="full" mb={10}>
						<ChakraUI.Flex justify="space-between" align="center">
							<ChakraUI.Heading as="h1" size="xl" color="green.600">
								FitTrack
							</ChakraUI.Heading>
							<ChakraUI.HStack spacing={6}>
								<ChakraUI.Link color="green.600" fontWeight="medium">
									Features
								</ChakraUI.Link>
								<ChakraUI.Link color="green.600" fontWeight="medium">
									Pricing
								</ChakraUI.Link>
								<ChakraUI.Link color="green.600" fontWeight="medium">
									About
								</ChakraUI.Link>
								<ChakraUI.Button colorScheme="green" size="md">
									Sign Up
								</ChakraUI.Button>
							</ChakraUI.HStack>
						</ChakraUI.Flex>
					</ChakraUI.Box>

					{/* Hero Section */}
					<ChakraUI.Flex
						direction={{ base: "column", md: "row" }}
						align="center"
						justify="space-between"
						mb={16}
						gap={8}
					>
						<ChakraUI.Box maxW={{ base: "100%", md: "50%" }}>
							<ChakraUI.Heading
								as="h2"
								size="2xl"
								lineHeight="1.2"
								mb={6}
								color="green.700"
							>
								Track Your Fitness Journey With Ease
							</ChakraUI.Heading>
							<ChakraUI.Text fontSize="xl" color="gray.600" mb={8}>
								Log workouts, track progress, and achieve your fitness goals
								with our simple and intuitive fitness tracking app.
							</ChakraUI.Text>
							<ChakraUI.Button
								colorScheme="green"
								size="lg"
								onClick={() => setWorkoutCount(workoutCount + 1)}
								mr={4}
							>
								Start Tracking
							</ChakraUI.Button>
							<ChakraUI.Text mt={4} color="gray.500" fontSize="md">
								{workoutCount > 0
									? `${workoutCount} workouts logged so far!`
									: "Log your first workout today!"}
							</ChakraUI.Text>
						</ChakraUI.Box>

						<ChakraUI.Box
							maxW={{ base: "100%", md: "45%" }}
							bg="white"
							borderRadius="lg"
							boxShadow="xl"
							p={6}
						>
							<ChakraUI.Image
								src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80"
								alt="Fitness tracking app"
								borderRadius="md"
							/>
						</ChakraUI.Box>
					</ChakraUI.Flex>

					{/* Features Section */}
					<ChakraUI.Box width="full" mb={16}>
						<ChakraUI.Heading
							as="h3"
							size="lg"
							mb={10}
							textAlign="center"
							color="green.600"
						>
							Key Features
						</ChakraUI.Heading>

						<ChakraUI.SimpleGrid columns={{ base: 1, md: 3 }} spacing={10}>
							<FeatureCard
								icon="dumbbell"
								title="Workout Logging"
								description="Easily log your workouts with our intuitive interface. Track sets, reps, and weights."
							/>
							<FeatureCard
								icon="chart-line"
								title="Progress Tracking"
								description="Visualize your progress over time with detailed charts and statistics."
							/>
							<FeatureCard
								icon="users"
								title="Community Support"
								description="Connect with other fitness enthusiasts and share your journey."
							/>
						</ChakraUI.SimpleGrid>
					</ChakraUI.Box>

					{/* CTA Section */}
					<ChakraUI.Box
						width="full"
						bg="green.600"
						color="white"
						borderRadius="lg"
						p={10}
						textAlign="center"
					>
						<ChakraUI.Heading as="h3" size="lg" mb={4}>
							Ready to start your fitness journey?
						</ChakraUI.Heading>
						<ChakraUI.Text fontSize="lg" mb={6} maxW="600px" mx="auto">
							Join thousands of users who have transformed their fitness routine
							with FitTrack.
						</ChakraUI.Text>
						<ChakraUI.Button
							colorScheme="white"
							variant="outline"
							size="lg"
							_hover={{ bg: "white", color: "green.600" }}
						>
							Get Started For Free
						</ChakraUI.Button>
					</ChakraUI.Box>
				</ChakraUI.Flex>
			</ChakraUI.Box>
		</ChakraUI.ChakraProvider>
	);
}

// Feature card component
function FeatureCard({ icon, title, description }) {
	return (
		<ChakraUI.Box
			bg="white"
			p={6}
			borderRadius="md"
			boxShadow="md"
			textAlign="center"
		>
			<ChakraUI.Box
				className={`fa fa-${icon}`}
				fontSize="3xl"
				color="green.500"
				mb={4}
			/>
			<ChakraUI.Heading as="h4" size="md" mb={3} color="gray.700">
				{title}
			</ChakraUI.Heading>
			<ChakraUI.Text color="gray.600">{description}</ChakraUI.Text>
		</ChakraUI.Box>
	);
}

export default MainComponent;
