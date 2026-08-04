import '../config/env';
import { sequelize } from '../config/db';
import { Course } from '../models/Course';

const mpmaCourses = [
  {
    courseCode: 'MAR-SEA',
    courseName: 'Maritime & Seamanship',
    stream: 'Maritime & Seamanship',
    description: 'Professional maritime seamanship training covering navigation, vessel handling, safety operations, and international seafaring standards.',
  },
  {
    courseCode: 'OHS',
    courseName: 'Occupational Health & Safety',
    stream: 'Occupational Health & Safety',
    description: 'Comprehensive workplace safety, emergency response, and regulatory compliance programs for maritime and industrial environments.',
  },
  {
    courseCode: 'PORT-LOG',
    courseName: 'Port Operation & Logistics',
    stream: 'Port Operation & Logistics',
    description: 'Training in port management, cargo logistics, terminal operations, shipping documentation, and supply chain coordination.',
  },
  {
    courseCode: 'TECH',
    courseName: 'Technical',
    stream: 'Technical',
    description: 'Hands-on technical programs covering marine engineering systems, machinery maintenance, electrical systems, and diagnostics.',
  },
  {
    courseCode: 'MGT-IS',
    courseName: 'Management & IS',
    stream: 'Management & IS',
    description: 'Leadership, maritime administration, business management, and information systems training for modern maritime professionals.',
  },
].map((course) => ({
  ...course,
  duration: '6 Months',
  medium: 'English',
  location: 'MPMA Campus',
  maxParticipants: 40,
  registrationFee: 0,
  courseFee: 0,
  status: 'Active' as const,
  schedule: 'Weekday' as const,
  type: 'Full Time' as const,
  mode: 'Physical' as const,
}));

const seedMpmaCourses = async () => {
  try {
    await sequelize.authenticate();
    await Course.sync();

    let created = 0;
    let updated = 0;

    for (const courseData of mpmaCourses) {
      const [course, wasCreated] = await Course.findOrCreate({
        where: { courseCode: courseData.courseCode },
        defaults: courseData,
      });

      if (wasCreated) {
        created += 1;
      } else {
        await course.update(courseData);
        updated += 1;
      }
    }

    console.log(`MPMA courses synchronized: ${created} created, ${updated} updated.`);
  } catch (error) {
    console.error('Unable to synchronize MPMA courses:', error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

seedMpmaCourses();
