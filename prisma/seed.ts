import { PrismaClient } from '../src/generated/prisma'
const prisma = new PrismaClient()

const SKILL_NAMES = ['React', 'Node.js', 'TypeScript', 'Python', 'Docker']

async function main() {
  console.log('🧹 Cleaning up database...')
  await prisma.jobApplication.deleteMany({})
  await prisma.skillOnProfile.deleteMany({})
  await prisma.jobSeekerProfile.deleteMany({})
  await prisma.jobListing.deleteMany({})
  await prisma.skill.deleteMany({})
  await prisma.user.deleteMany({})

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
  await prisma.user.createMany({
    data: Array.from({ length: 10 }, (_, i) => ({
      name: `Admin ${i + 1}`,
      phone: `100000000${i + 1}`,
      email: `admin${i + 1}@example.com`,
      role: 'ADMIN',
    })),
  })

  await prisma.user.createMany({
    data: Array.from({ length: 10 }, (_, i) => ({
      name: `Mod ${i + 1}`,
      phone: `110000000${i + 1}`,
      email: `moderator${i + 1}@example.com`,
      role: 'MODERATOR',
    })),
  })

  // Employers and their Jobs
  const employers = await Promise.all(
    Array.from({ length: 10 }, async (_, i) => {
      const employer = await prisma.user.create({
        data: {
          name: `Company ${i + 1}`,
          phone: `120000000${i + 1}`,
          email: `employer${i + 1}@company.com`,
          role: 'EMPLOYER',
        },
      })

      const jobCount = Math.floor(Math.random() * 2) + 1
      for (let j = 0; j < jobCount; j++) {
        await prisma.jobListing.create({
          data: {
            title: `Job ${j + 1} at Company ${i + 1}`,
            description: `Exciting opportunity at Company ${i + 1}`,
            company: employer.name,
            location: j % 2 === 0 ? 'Addis Ababa' : 'Remote',
            tags: ['Tech', 'Innovation'],
            employerId: employer.id,
          },
        })
      }

      return employer
    })
  )

  const allJobs = await prisma.jobListing.findMany()

  // Job Seekers with Profiles and Skills
  const jobSeekers = await Promise.all(
    Array.from({ length: 10 }, async (_, i) => {
      const user = await prisma.user.create({
        data: {
          name: `Seeker ${i + 1}`,
          phone: `130000000${i + 1}`,
          email: `seeker${i + 1}@mail.com`,
          role: 'JOB_SEEKER',
        },
      })

      const profile = await prisma.jobSeekerProfile.create({
        data: {
          jobSeekerId: user.id,
          bio: `I am Seeker ${i + 1}`,
          experience: `Experience ${i + 1}`,
          education: `BSc in Field ${i + 1}`,
          resumeUrl: `https://example.com/resume${i + 1}.pdf`,
        },
      })

      const randomSkills = skills.sort(() => 0.5 - Math.random()).slice(0, 2 + (i % 2))
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

  // Job Applications
  for (let i = 0; i < 10; i++) {
    const seeker = jobSeekers[i]
    const job = allJobs[Math.floor(Math.random() * allJobs.length)]
    await prisma.jobApplication.create({
      data: {
        userId: seeker.id,
        jobId: job.id,
        status: 'pending',
      },
    })
  }

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
