import { PrismaClient } from '../src/generated/prisma'
const prisma = new PrismaClient()

const SKILL_NAMES = [
  'React', 'Node.js', 'TypeScript', 'Python', 'Docker', 'AWS', 'MongoDB', 'PostgreSQL',
  'JavaScript', 'Java', 'C++', 'C#', '.NET', 'Angular', 'Vue.js', 'GraphQL', 'REST API',
  'Machine Learning', 'Data Science', 'DevOps', 'Kubernetes', 'Git', 'Agile', 'Scrum',
  'Product Management', 'UX Design', 'UI Design', 'Figma', 'Adobe Creative Suite',
  'Digital Marketing', 'SEO', 'Content Marketing', 'Social Media Marketing',
  'Sales', 'Customer Success', 'Business Development', 'Finance', 'Accounting',
  'Human Resources', 'Recruitment', 'Project Management', 'Leadership', 'Communication'
]

const JOB_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'FREELANCE']
const LOCATIONS = ['Addis Ababa', 'Dire Dawa', 'Bahir Dar', 'Mekelle', 'Remote', 'Nairobi', 'Lagos', 'Cairo']
const COMPANIES = [
  'Tech Corp', 'Startup Inc', 'Design Co', 'Analytics Pro', 'Growth Co', 'Web Solutions',
  'Design Studio', 'Tech Startup', 'Analytics Corp', 'Big Tech', 'Research Lab',
  'Econnect', 'Awash Bank', 'Ethio Telecom', 'Ethiopian Airlines', 'Commercial Bank of Ethiopia'
]

const UNIVERSITIES = [
  'Addis Ababa University', 'Bahir Dar University', 'Mekelle University', 'Jimma University',
  'Hawassa University', 'Gondar University', 'Arba Minch University', 'Adama Science and Technology University'
]

const JOB_TITLES = [
  'Software Engineer', 'Senior Software Engineer', 'Full Stack Developer', 'Frontend Developer',
  'Backend Developer', 'DevOps Engineer', 'Data Scientist', 'Product Manager', 'UX Designer',
  'UI Designer', 'Marketing Manager', 'Sales Representative', 'Business Analyst',
  'Project Manager', 'Human Resources Manager', 'Financial Analyst', 'Content Creator'
]

async function main() {
  console.log('🧹 Cleaning up database...')
  await prisma.message.deleteMany({})
  await prisma.jobApplication.deleteMany({})
  await prisma.skillOnProfile.deleteMany({})
  await prisma.education.deleteMany({})
  await prisma.experience.deleteMany({})
  await prisma.jobSeekerProfile.deleteMany({})
  await prisma.jobBookmark.deleteMany({})
  await prisma.jobListing.deleteMany({})
  await prisma.connection.deleteMany({})
  await prisma.skill.deleteMany({})
  await prisma.notification.deleteMany({})
  await prisma.like.deleteMany({})
  await prisma.comment.deleteMany({})
  await prisma.post.deleteMany({})
  await prisma.user.deleteMany({})
  await prisma.pendingUser.deleteMany({})

  console.log('🌱 Seeding database...')

  // Create skills
  const skills = await Promise.all(
    SKILL_NAMES.map(name =>
      prisma.skill.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  )

  // Create admin users
  const admins = await Promise.all(
    Array.from({ length: 2 }).map((_, i) =>
      prisma.user.create({
        data: {
          name: `Admin ${i + 1}`,
          phone: `90000000${i}`,
          email: `admin${i + 1}@econnect.et`,
          password: 'password123',
          role: 'ADMIN',
        },
      })
    )
  )

  // Create employer users
  const employers = await Promise.all(
    COMPANIES.slice(0, 8).map((company, i) =>
      prisma.user.create({
        data: {
          name: company,
          phone: `9110000${i}`,
          email: `hr@${company.toLowerCase().replace(' ', '')}.et`,
          role: 'EMPLOYER',
          password: 'password123',
        },
      })
    )
  )

  // Create job seeker users with comprehensive profiles
  const jobSeekers = await Promise.all(
    [
      'Alemayehu Kebede', 'Selamawit Assefa', 'Tewodros Mekonnen', 'Hirut Abebe',
      'Yohannes Tadesse', 'Bethel Teklu', 'Dawit Haile', 'Rahel Mengistu',
      'Michael Johnson', 'Sarah Wilson', 'David Chen', 'Emily Rodriguez',
      'Alex Thompson', 'Lisa Park', 'James Wilson', 'Maria Garcia',
      'Robert Kim', 'Jennifer Lee', 'Christopher Brown', 'Amanda Davis',
      'Johannes Bekele' // Added the missing user
    ].map(async (fullName, i) => {
      const [firstName] = fullName.split(' ')
      const user = await prisma.user.create({
        data: {
          name: fullName,
          phone: `91234567${i}`,
          email: i === 20 ? 'jbekele@bu.edu' : `${firstName.toLowerCase()}@mail.com`, // Special email for Johannes
          role: 'JOB_SEEKER',
          password: 'password123',
        },
      })

      const profile = await prisma.jobSeekerProfile.create({
        data: {
          jobSeekerId: user.id,
          bio: `I am an experienced ${['developer', 'designer', 'manager', 'analyst'][i % 4]} with a passion for innovation and growth.`,
          resumeUrl: `https://econnect.et/resumes/${user.id}.pdf`,
        },
      })

      // Add education
      await prisma.education.create({
        data: {
          jobSeekerProfileId: profile.id,
          school: UNIVERSITIES[i % UNIVERSITIES.length],
          degreeType: ['BACHELOR', 'MASTER', 'PHD'][i % 3] as any,
          fieldOfStudy: ['Computer Science', 'Business Administration', 'Engineering', 'Design'][i % 4],
          grade: 3.0 + (Math.random() * 1.0),
          StartYear: 2010 + (i % 10),
          EndYear: 2014 + (i % 10),
          activites: ['Coding Club', 'Student Council', 'Sports Team', 'Debate Club'][i % 4],
        },
      })

      // Add experience
      await prisma.experience.create({
        data: {
          jobSeekerProfileId: profile.id,
          jobTitle: JOB_TITLES[i % JOB_TITLES.length],
          company: COMPANIES[i % COMPANIES.length],
          location: LOCATIONS[i % LOCATIONS.length],
          employmentType: 'Full-time',
          startDate: new Date(`2019-01-01`),
          endDate: null,
          current: true,
          description: 'Worked on various projects and contributed to team success.',
        },
      })

      // Add skills
      const randomSkills = skills.sort(() => 0.5 - Math.random()).slice(0, 5)
      for (const skill of randomSkills) {
        await prisma.skillOnProfile.create({
          data: {
            profileId: profile.id,
            skillId: skill.id,
          },
        })
      }

      return user
    })
  )

  // Create job listings
  const jobListings = []
  for (const employer of employers) {
    for (let j = 0; j < 4; j++) {
      const job = await prisma.jobListing.create({
        data: {
          title: JOB_TITLES[j % JOB_TITLES.length],
          description: `We are looking for a talented ${JOB_TITLES[j % JOB_TITLES.length]} to join our growing team at ${employer.name}.`,
          company: employer.name,
          location: LOCATIONS[j % LOCATIONS.length],
          tags: ['Tech', 'Engineering', 'Innovation'],
          salary: `${5000 + j * 1000}`,
          jobType: JOB_TYPES[j % JOB_TYPES.length] as any,
          employerId: employer.id,
        },
      })
      jobListings.push(job)
    }
  }

  // Create job applications
  for (const seeker of jobSeekers) {
    const jobsToApply = jobListings.sort(() => 0.5 - Math.random()).slice(0, 3)
    for (const job of jobsToApply) {
      await prisma.jobApplication.create({
        data: {
          userId: seeker.id,
          jobId: job.id,
          coverLetter: `I am interested in the ${job.title} role at ${job.company}.`,
          resumeUrl: `https://econnect.et/resumes/${seeker.id}.pdf`,
        },
      })
    }
  }

  // Create connections
  const connections = []
  for (let i = 0; i < jobSeekers.length; i++) {
    for (let j = i + 1; j < Math.min(i + 4, jobSeekers.length); j++) {
      const status = Math.random() > 0.3 ? 'ACCEPTED' : 'PENDING'
      const connection = await prisma.connection.create({
        data: {
          senderId: jobSeekers[i].id,
          receiverId: jobSeekers[j].id,
          status: status as any,
        },
      })
      connections.push(connection)
    }
  }

  // Create messages
  for (const connection of connections.filter(c => c.status === 'ACCEPTED')) {
    await prisma.message.create({
      data: {
        senderId: connection.senderId,
        recipientId: connection.receiverId,
        text: 'Hi! Great to connect with you on Econnect!',
      },
    })
  }

  // Create posts
  const posts = []
  for (const seeker of jobSeekers.slice(0, 10)) {
    const post = await prisma.post.create({
      data: {
        content: [
          'Excited to share that I\'ve joined a new company! Looking forward to this new chapter.',
          'Just published a new article on modern web development practices. Check it out!',
          'Great networking event today! Met so many talented professionals.',
          'Working on an exciting new project. Can\'t wait to share more details soon.',
          'Happy to announce that our team has successfully launched a new product!',
          'Attended an amazing conference today. Learned so much about emerging technologies.',
          'Proud to be part of such an innovative team. The future looks bright!',
          'Just completed a challenging project. The learning never stops!',
          'Networking is key to professional growth. Thanks to everyone who connected today.',
          'Excited about the opportunities ahead. Stay tuned for updates!'
        ][Math.floor(Math.random() * 10)],
        authorId: seeker.id,
        type: 'TEXT',
      },
    })
    posts.push(post)
  }

  // Create likes and comments
  for (const post of posts) {
    const likers = jobSeekers.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 8) + 1)
    for (const liker of likers) {
      await prisma.like.create({
        data: {
          userId: liker.id,
          postId: post.id,
        },
      })
    }

    const commenters = jobSeekers.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 3) + 1)
    for (const commenter of commenters) {
      await prisma.comment.create({
        data: {
          userId: commenter.id,
          postId: post.id,
          content: [
            'Congratulations! This is amazing news.',
            'Great work! Keep it up.',
            'Thanks for sharing this valuable insight.',
            'Looking forward to seeing more updates.',
            'This is really inspiring!'
          ][Math.floor(Math.random() * 5)],
        },
      })
    }
  }

  // Create notifications
  for (const seeker of jobSeekers) {
    // Connection request notifications
    const pendingConnections = connections.filter(c => 
      c.receiverId === seeker.id && c.status === 'PENDING'
    )
    for (const connection of pendingConnections) {
      await prisma.notification.create({
        data: {
          userId: seeker.id,
          type: 'CONNECTION_REQUEST',
          title: 'New connection request',
          message: `${jobSeekers.find(s => s.id === connection.senderId)?.name} wants to connect with you`,
          read: false,
        },
      })
    }

    // Job application notifications
    const applications = await prisma.jobApplication.findMany({
      where: { userId: seeker.id }
    })
    for (const application of applications.slice(0, 2)) {
      await prisma.notification.create({
        data: {
          userId: seeker.id,
          type: 'APPLICATION_UPDATE',
          title: 'Application submitted',
          message: `Your application for ${jobListings.find(j => j.id === application.jobId)?.title} has been submitted`,
          read: false,
        },
      })
    }

    // Like notifications
    const userPosts = posts.filter(p => p.authorId === seeker.id)
    for (const post of userPosts.slice(0, 2)) {
      const likes = await prisma.like.findMany({
        where: { postId: post.id }
      })
      for (const like of likes.slice(0, 2)) {
        await prisma.notification.create({
          data: {
            userId: seeker.id,
            type: 'LIKE',
            title: 'New like on your post',
            message: `${jobSeekers.find(s => s.id === like.userId)?.name} liked your post`,
            read: false,
          },
        })
      }
    }
  }

  console.log('✅ Seed complete')
  console.log(`Created ${jobSeekers.length} job seekers`)
  console.log(`Created ${employers.length} employers`)
  console.log(`Created ${jobListings.length} job listings`)
  console.log(`Created ${connections.length} connections`)
  console.log(`Created ${posts.length} posts`)
  console.log(`Created ${skills.length} skills`)
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
