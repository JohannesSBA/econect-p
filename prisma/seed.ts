import { PrismaClient } from '../src/generated/prisma'
const prisma = new PrismaClient()

const SKILL_NAMES = ['React', 'Node.js', 'TypeScript', 'Python', 'Docker']
const JOB_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'FREELANCE']
const LOCATIONS = ['Addis Ababa', 'Dire Dawa', 'Bahir Dar', 'Mekelle', 'Remote']

async function main() {
  console.log('🧹 Cleaning up database...')
  await prisma.message.deleteMany({})
  await prisma.jobApplication.deleteMany({})
  await prisma.skillOnProfile.deleteMany({})
  await prisma.jobSeekerProfile.deleteMany({})
  await prisma.jobListing.deleteMany({})
  await prisma.skill.deleteMany({})
  await prisma.user.deleteMany({})
  await prisma.pendingUser.deleteMany({})

  console.log('🌱 Seeding database...')

  // Seed Skills
  const skills = await Promise.all(
    SKILL_NAMES.map((name) =>
      prisma.skill.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  )

  // Admins & Moderators
  const admins = await Promise.all(
    Array.from({ length: 5 }, (_, i) =>
      prisma.user.create({
        data: {
          name: `Admin ${i + 1}`,
          phone: `91100000${i + 1}`,
          email: `admin${i + 1}@econnect.et`,
          role: 'ADMIN',
          language: 'en',
          password: 'password123'
        },
      })
    )
  )

  // Employers with realistic Ethiopian company names
  const employers = await Promise.all(
    ['Awash Bank', 'Ethio Telecom', 'Dashen Brewery', 'Hibret Bank', 'Sunshine Construction'].map(async (name, i) => {
      const employer = await prisma.user.create({
        data: {
          name,
          phone: `9112345${i}00`,
          email: `hr@${name.toLowerCase().replace(' ', '')}.et`,
          role: 'EMPLOYER',
          language: 'en',
          password: 'password123'
        },
      })

      // Create 2-4 job listings per employer
      const jobCount = Math.floor(Math.random() * 3) + 2
      for (let j = 0; j < jobCount; j++) {
        await prisma.jobListing.create({
          data: {
            title: `${['Senior', 'Junior', 'Mid-level'][j % 3]} ${['Developer', 'Accountant', 'Engineer', 'Manager'][j % 4]}`,
            description: `Exciting opportunity at ${name} - ${['Innovative', 'Leading', 'Fast-growing', 'Established'][j % 4]} company seeking talented professionals.`,
            company: name,
            location: LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)],
            tags: ['Tech', 'Finance', 'Engineering', 'Management'][j % 4] === 'Tech' ? ['Tech', 'Development'] : ['Finance', 'Banking'],
            salary: `${Math.floor(Math.random() * 30 + 20)}000`,
            jobType: JOB_TYPES[Math.floor(Math.random() * JOB_TYPES.length)] as any,
            status: 'OPEN',
            employerId: employer.id,
          },
        })
      }

      return employer
    })
  )

  // Job Seekers with Ethiopian names
  const jobSeekers = await Promise.all(
    [
      'Alemayehu Kebede', 'Selamawit Assefa', 'Tewodros Mekonnen', 
      'Hirut Abebe', 'Dawit Wolde', 'Eyerusalem Tesfaye'
    ].map(async (name, i) => {
      const [firstName, lastName] = name.split(' ')
      const user = await prisma.user.create({
        data: {
          name: `${firstName} ${lastName}`,
          phone: `91234567${i}0`,
          email: `${firstName.toLowerCase()}@mail.com`,
          role: 'JOB_SEEKER',
          language: i % 2 === 0 ? 'am' : 'en',
          password: 'password123'
        },
      })

      const profile = await prisma.jobSeekerProfile.create({
        data: {
          jobSeekerId: user.id,
          bio: `Experienced ${['developer', 'accountant', 'engineer'][i % 3]} with ${i + 2} years in the field`,
          resumeUrl: `https://econnect.et/resumes/${user.id}.pdf`,
        },
      })

      // Add experiences
      const experienceCount = Math.floor(Math.random() * 2) + 1 // 1-2 experiences
      for (let expIdx = 0; expIdx < experienceCount; expIdx++) {
        const startYear = new Date().getFullYear() - (i + 2) - expIdx
        await prisma.experience.create({
          data: {
            jobSeekerProfileId: profile.id,
            jobTitle: `${['Senior', 'Junior', 'Mid-level'][expIdx % 3]} ${['Developer', 'Accountant', 'Engineer'][i % 3]}`,
            company: `${['Tech', 'Financial', 'Engineering'][i % 3]} Solutions Ethiopia`,
            location: LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)],
            employmentType: ['Full-time', 'Part-time', 'Contract'][expIdx % 3],
            startDate: new Date(`${startYear}-01-01`),
            endDate: expIdx === 0 ? null : new Date(`${startYear + 1}-12-31`),
            current: expIdx === 0,
            description: `Worked on ${['software development', 'financial analysis', 'construction projects'][i % 3]}`
          }
        })
      }

      // Assign 3-5 random skills
      const randomSkills = skills.sort(() => 0.5 - Math.random()).slice(0, 3 + (i % 2))
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

  // Create realistic job applications
  const allJobs = await prisma.jobListing.findMany()
  for (const seeker of jobSeekers) {
    // Get unique random jobs to apply for
    const applications = Math.floor(Math.random() * 3) + 1
    const shuffledJobs = [...allJobs].sort(() => 0.5 - Math.random())
    const jobsToApply = shuffledJobs.slice(0, applications)
    
    for (const job of jobsToApply) {
      await prisma.jobApplication.create({
        data: {
          userId: seeker.id,
          jobId: job.id,
          status: Math.random() > 0.8 ? 'rejected' : 'pending',
          appliedAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000))
        },
      })
    }
  }

  console.log('👥 Adding friends and messages...')
  // Create friendships between job seekers
  for (let i = 0; i < jobSeekers.length; i += 2) {
    const user1 = jobSeekers[i]
    const user2 = jobSeekers[i + 1]
    if (!user2) break

    // Create mutual friendship
    await prisma.user.update({
      where: { id: user1.id },
      data: { 
        friends: { connect: { id: user2.id } },
        friendOf: { connect: { id: user2.id } }
      }
    })

    // Create messages between them
    const messages = [
      { text: 'Hi! How are you?', daysAgo: 3 },
      { text: 'I’m good, thanks! How about you?', daysAgo: 2 },
      { text: 'Want to meet up tomorrow?', daysAgo: 1 }
    ]

    for (const msg of messages) {
      await prisma.message.create({
        data: {
          text: msg.text,
          senderId: user1.id,
          recipientId: user2.id,
          createdAt: new Date(Date.now() - msg.daysAgo * 24 * 60 * 60 * 1000)
        }
      })
      // Create reciprocal message
      await prisma.message.create({
        data: {
          text: `Sure, let's meet at the cafe.`,
          senderId: user2.id,
          recipientId: user1.id,
          createdAt: new Date(Date.now() - (msg.daysAgo - 0.5) * 24 * 60 * 60 * 1000)
        }
      })
    }
  }

  // Create some pending friend requests
  await prisma.user.update({
    where: { id: jobSeekers[0].id },
    data: { sentFriendRequest: { connect: { id: jobSeekers[2].id } } }
  })
  await prisma.user.update({
    where: { id: jobSeekers[2].id },
    data: { pendingFriendRequest: { connect: { id: jobSeekers[0].id } } }
  })

  console.log('✅ Seed complete')
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
