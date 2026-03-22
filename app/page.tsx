import UserLayout from './_components/UserLayout'
import VideoCard from './_components/VideoCard'

/* ─── Regular videos ─── */
const videos = [
	{
		thumbnail:
			'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=640&q=80',
		title: 'BMW 540i FIRST PERSON + FUNNY MOMENTS WITH WILDBERRIES!',
		channel: 'SADOVOV LIFE',
		channelAvatar: 'S',
		channelColor: 'bg-red-600',
		views: '30K views',
		uploadedAt: '4 months ago',
		duration: '38:11',
	},
	{
		thumbnail:
			'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=640&q=80',
		title: 'Taylor Swift – Midnights (Full Album)',
		channel: 'Taylor Swift Official',
		channelAvatar: 'T',
		channelColor: 'bg-pink-600',
		views: '12.5M views',
		uploadedAt: '8 months ago',
		duration: '44:08',
	},
	{
		thumbnail:
			'https://images.unsplash.com/photo-1549576490-b0b4831ef60a?w=640&q=80',
		title: 'UFC Evloev vs Murphy Immediate Reaction/Recap (It Sucked)',
		channel: 'Bedtime MMA',
		channelAvatar: 'B',
		channelColor: 'bg-pink-600',
		views: '54K views',
		uploadedAt: '18 hours ago',
		duration: '24:56',
	},
	{
		thumbnail:
			'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=640&q=80',
		title: 'Top 10 Best PC Games of 2024 – Must Play Right Now',
		channel: 'Gaming Weekly',
		channelAvatar: 'G',
		channelColor: 'bg-teal-600',
		views: '890K views',
		uploadedAt: '3 weeks ago',
		duration: '18:45',
	},
	{
		thumbnail:
			'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=640&q=80',
		title: 'Hiking the Most Dangerous Trail in the World – Alone',
		channel: 'Adventure Seeker',
		channelAvatar: 'A',
		channelColor: 'bg-orange-600',
		views: '2.3M views',
		uploadedAt: '5 months ago',
		duration: '42:17',
	},
	{
		thumbnail:
			'https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=640&q=80',
		title: "Gordon Ramsay's ULTIMATE Beef Wellington – Step by Step Guide",
		channel: 'Cooking Master',
		channelAvatar: 'C',
		channelColor: 'bg-red-700',
		views: '4.1M views',
		uploadedAt: '1 year ago',
		duration: '28:03',
	},
	{
		thumbnail:
			'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=640&q=80',
		title: 'I Built an AI That Can Hack Any System – Full Tutorial',
		channel: 'TechWizard',
		channelAvatar: 'T',
		channelColor: 'bg-blue-700',
		views: '720K views',
		uploadedAt: '2 weeks ago',
		duration: '51:22',
	},
	{
		thumbnail:
			'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=640&q=80',
		title: 'I Spent 30 Days Transforming My Body – Unbelievable Results',
		channel: 'FitnessJourney',
		channelAvatar: 'F',
		channelColor: 'bg-green-700',
		views: '3.5M views',
		uploadedAt: '6 months ago',
		duration: '15:38',
	},
	{
		thumbnail:
			'https://images.unsplash.com/photo-1518770660439-4636190af475?w=640&q=80',
		title: 'Building a Custom PC for $300 – Complete Build Guide 2024',
		channel: 'PCBuilderPro',
		channelAvatar: 'P',
		channelColor: 'bg-cyan-700',
		views: '1.8M views',
		uploadedAt: '8 months ago',
		duration: '33:14',
	},
	{
		thumbnail:
			'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=640&q=80',
		title: 'Top 50 Hip-Hop Songs That Defined the 2010s',
		channel: 'HipHop Archive',
		channelAvatar: 'H',
		channelColor: 'bg-indigo-700',
		views: '5.6M views',
		uploadedAt: '2 years ago',
		duration: '2:14:58',
	},
	{
		thumbnail:
			'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=640&q=80',
		title: 'Tesla Cybertruck Review After 6 Months – Honest Opinion',
		channel: 'AutoReviewer',
		channelAvatar: 'A',
		channelColor: 'bg-orange-700',
		views: '2.9M views',
		uploadedAt: '3 months ago',
		duration: '22:47',
	},
	{
		thumbnail:
			'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=640&q=80',
		title: 'Calisthenics Full Body Workout – No Equipment Needed',
		channel: 'StreetWorkout',
		channelAvatar: 'S',
		channelColor: 'bg-lime-700',
		views: '445K views',
		uploadedAt: '1 month ago',
		duration: '47:30',
	},
]

/* ─── Shorts ─── */
const shorts = [
	{
		thumbnail:
			'https://images.unsplash.com/photo-1555774698-0b77e0d5fac6?w=400&h=700&fit=crop&q=80',
		title: 'MMA fighter lands insane KO',
		views: '4.2M views',
	},
	{
		thumbnail:
			'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=700&fit=crop&q=80',
		title: 'Mountain trail run timelapse',
		views: '1.1M views',
	},
	{
		thumbnail:
			'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=700&fit=crop&q=80',
		title: 'Street interview gone wrong 😂',
		views: '8.7M views',
	},
	{
		thumbnail:
			'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=700&fit=crop&q=80',
		title: 'Gym motivation clip of the day',
		views: '920K views',
	},
	{
		thumbnail:
			'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=700&fit=crop&q=80',
		title: 'Beat drop compilation 🔥',
		views: '3.3M views',
	},
	{
		thumbnail:
			'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=700&fit=crop&q=80',
		title: 'Gaming rage moments #shorts',
		views: '2.5M views',
	},
]
 


const videos2 = [
	{
		thumbnail:
			'https://images.unsplash.com/photo-1581091215364-55f46a8f9f83?w=640&q=80',
		title: 'Exploring the Hidden Waterfalls of Iceland',
		channel: 'Nature Explorer',
		channelAvatar: 'N',
		channelColor: 'bg-blue-500',
		views: '1.2M views',
		uploadedAt: '2 months ago',
		duration: '19:42',
	},
	{
		thumbnail:
			'https://images.unsplash.com/photo-1593642532973-d31b6557fa68?w=640&q=80',
		title: 'Top 5 Productivity Apps for Developers in 2026',
		channel: 'CodeSmart',
		channelAvatar: 'C',
		channelColor: 'bg-green-600',
		views: '87K views',
		uploadedAt: '3 weeks ago',
		duration: '12:15',
	},
	{
		thumbnail:
			'https://images.unsplash.com/photo-1581091012184-bb4b71f07b3d?w=640&q=80',
		title: 'Street Food Tour: Tokyo Edition',
		channel: 'Food Nomad',
		channelAvatar: 'F',
		channelColor: 'bg-yellow-600',
		views: '2.5M views',
		uploadedAt: '1 month ago',
		duration: '25:50',
	},
	{
		thumbnail:
			'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=640&q=80',
		title: 'Minimalist Home Office Makeover on a Budget',
		channel: 'Design Lab',
		channelAvatar: 'D',
		channelColor: 'bg-pink-500',
		views: '345K views',
		uploadedAt: '2 weeks ago',
		duration: '14:20',
	},
	{
		thumbnail:
			'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=640&q=80',
		title: 'Wildlife Photography Tips for Beginners',
		channel: 'PhotoHunt',
		channelAvatar: 'P',
		channelColor: 'bg-purple-600',
		views: '580K views',
		uploadedAt: '5 months ago',
		duration: '33:05',
	},
	{
		thumbnail:
			'https://images.unsplash.com/photo-1593642634315-48f5414c3ad9?w=640&q=80',
		title: 'AI Tools That Will Change Your Workflow in 2026',
		channel: 'Tech Today',
		channelAvatar: 'T',
		channelColor: 'bg-cyan-600',
		views: '1.1M views',
		uploadedAt: '1 month ago',
		duration: '29:40',
	},
	{
		thumbnail:
			'https://images.unsplash.com/photo-1572373671164-5f6d5d8d4e0a?w=640&q=80',
		title: 'Epic Mountain Biking Adventure in the Alps',
		channel: 'Adrenaline Rush',
		channelAvatar: 'A',
		channelColor: 'bg-red-600',
		views: '980K views',
		uploadedAt: '3 weeks ago',
		duration: '22:10',
	},
	{
		thumbnail:
			'https://images.unsplash.com/photo-1549887534-52f22a4d7c9d?w=640&q=80',
		title: 'DIY Solar Panel Installation at Home',
		channel: 'Eco Builder',
		channelAvatar: 'E',
		channelColor: 'bg-lime-600',
		views: '420K views',
		uploadedAt: '2 months ago',
		duration: '31:55',
	},
	{
		thumbnail:
			'https://images.unsplash.com/photo-1573164574391-cb7c8c2a4c63?w=640&q=80',
		title: 'React 2026: New Features You Must Know',
		channel: 'Frontend Hub',
		channelAvatar: 'F',
		channelColor: 'bg-indigo-600',
		views: '76K views',
		uploadedAt: '1 week ago',
		duration: '18:22',
	},
	{
		thumbnail:
			'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=640&q=80',
		title: 'Relaxing Ocean Waves & Nature Sounds for Sleep',
		channel: 'Zen World',
		channelAvatar: 'Z',
		channelColor: 'bg-teal-600',
		views: '12M views',
		uploadedAt: '6 months ago',
		duration: '1:00:00',
	},
	{
		thumbnail:
			'https://images.unsplash.com/photo-1549921296-3e9c8c7b25f4?w=640&q=80',
		title: 'Top 10 Futuristic Gadgets Coming in 2026',
		channel: 'Gadget Guru',
		channelAvatar: 'G',
		channelColor: 'bg-orange-600',
		views: '890K views',
		uploadedAt: '2 weeks ago',
		duration: '21:45',
	},
	{
		thumbnail:
			'https://images.unsplash.com/photo-1523966211570-0b2f3d6f2f32?w=640&q=80',
		title: 'Yoga for Beginners – 30 Minute Full Session',
		channel: 'Mind & Body',
		channelAvatar: 'M',
		channelColor: 'bg-pink-600',
		views: '650K views',
		uploadedAt: '1 month ago',
		duration: '30:00',
	},
]
export default function Home() {
	return (
		<UserLayout>
			{/* ── 4-col video grid ── */}
			<div className='grid grid-cols-4 gap-x-3 gap-y-6 pt-4'>
				{videos.map((video, i) => (
					<VideoCard key={i} {...video} />
				))}
			</div>

			{/* ── Shorts section ── */}
			<div className='mt-10 mb-2'>
				<div className='flex items-center justify-between mb-4 px-0.5'>
					<div className='flex items-center gap-2'>
						<svg
							className='w-6 h-6 text-red-500'
							viewBox='0 0 24 24'
							fill='currentColor'
						>
							<path d='M17.77 10.32l-1.2-.5L18 9.19C19.38 8.42 19.86 6.68 19.09 5.3c-.77-1.38-2.51-1.86-3.89-1.09l-5.85 3.28-.01.02-1.17.65c-1.38.77-1.86 2.51-1.09 3.89.28.49.68.87 1.14 1.12l1.2.5L8 13.81C6.62 14.58 6.14 16.32 6.91 17.7c.77 1.38 2.51 1.86 3.89 1.09l5.85-3.27.01-.01 1.17-.65c1.38-.77 1.86-2.51 1.09-3.89-.28-.49-.68-.87-1.15-1.14zM13 14.5l-2-1.17 2-1.16 2 1.16-2 1.17z' />
						</svg>
						<span className='text-xl font-bold text-white'>Shorts</span>
					</div>
					<button className='p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer bg-transparent border-none text-white'>
						<svg className='w-5 h-5' viewBox='0 0 24 24' fill='currentColor'>
							<path d='M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z' />
						</svg>
					</button>
				</div>

				<div
					className='flex gap-3 overflow-x-auto pb-2'
					style={{ scrollbarWidth: 'none' }}
				>
					{shorts.map((short, i) => (
						<div key={i} className='shrink-0 w-[280px] cursor-pointer group'>
							<div
								className='relative rounded-xl overflow-hidden bg-[#1a1a1a]'
								style={{ paddingBottom: '140%' }}
							>
								<img
									src={short.thumbnail}
									alt={short.title}
									className='absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-200'
								/>
							</div>
							<p className='mt-2 text-[12px] font-semibold text-white line-clamp-2 leading-snug'>
								{short.title}
							</p>
							<p className='mt-0.5 text-[12px] text-[#aaa]'>{short.views}</p>
						</div>
					))}
				</div>
			</div>
			<div className='grid grid-cols-4 gap-x-3 gap-y-6 pt-4'>
				{videos2.map((video, i) => (
					<VideoCard key={i} {...video} />
				))}
			</div>
		</UserLayout>
	)
}
