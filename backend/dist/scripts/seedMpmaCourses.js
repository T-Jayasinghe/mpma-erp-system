"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
require("../config/env");
const db_1 = require("../config/db");
const Course_1 = require("../models/Course");
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
].map((course) => (Object.assign(Object.assign({}, course), { duration: '6 Months', medium: 'English', location: 'MPMA Campus', maxParticipants: 40, registrationFee: 0, courseFee: 0, status: 'Active', schedule: 'Weekday', type: 'Full Time', mode: 'Physical' })));
const seedMpmaCourses = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield db_1.sequelize.authenticate();
        yield Course_1.Course.sync();
        let created = 0;
        let updated = 0;
        for (const courseData of mpmaCourses) {
            const [course, wasCreated] = yield Course_1.Course.findOrCreate({
                where: { courseCode: courseData.courseCode },
                defaults: courseData,
            });
            if (wasCreated) {
                created += 1;
            }
            else {
                yield course.update(courseData);
                updated += 1;
            }
        }
        console.log(`MPMA courses synchronized: ${created} created, ${updated} updated.`);
    }
    catch (error) {
        console.error('Unable to synchronize MPMA courses:', error);
        process.exitCode = 1;
    }
    finally {
        yield db_1.sequelize.close();
    }
});
seedMpmaCourses();
