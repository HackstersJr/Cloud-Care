import { PrismaClient, UserRole, Gender, BloodType, RecordType, Severity } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create a test patient user
  const hashedPassword = await bcrypt.hash('patient123', 12);
  
  const patientUser = await prisma.user.upsert({
    where: { email: 'patient@example.com' },
    update: {},
    create: {
      id: '19e83482-c4b0-4dec-9ad6-5f93a287f0aa', // Use the UUID from logs
      email: 'patient@example.com',
      passwordHash: hashedPassword,
      role: UserRole.patient,
      isVerified: true,
      isEmailVerified: true,
      profileCompleted: true,
      isActive: true,
    },
  });

  console.log('✅ Created patient user:', patientUser.email);

  // Create patient profile
  const patient = await prisma.patient.upsert({
    where: { userId: patientUser.id },
    update: {},
    create: {
      userId: patientUser.id,
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: new Date('1990-05-15'),
      gender: Gender.male,
      phoneNumber: '+1234567890',
      bloodType: BloodType.O_POSITIVE,
      address: {
        street: '123 Main St',
        city: 'Healthcare City',
        state: 'HC',
        zipCode: '12345',
        country: 'USA'
      },
      emergencyContact: {
        name: 'Jane Doe',
        relationship: 'Spouse',
        phoneNumber: '+1234567891'
      },
      maritalStatus: 'married',
      occupation: 'Software Engineer',
    },
  });

  console.log('✅ Created patient profile:', patient.firstName, patient.lastName);

  // Create a doctor user
  const doctorHashedPassword = await bcrypt.hash('doctor123', 12);
  
  const doctorUser = await prisma.user.upsert({
    where: { email: 'doctor@example.com' },
    update: {},
    create: {
      email: 'doctor@example.com',
      passwordHash: doctorHashedPassword,
      role: UserRole.doctor,
      isVerified: true,
      isEmailVerified: true,
      profileCompleted: true,
      isActive: true,
    },
  });

  console.log('✅ Created doctor user:', doctorUser.email);

  // Create doctor profile
  const doctor = await prisma.doctor.upsert({
    where: { userId: doctorUser.id },
    update: {},
    create: {
      userId: doctorUser.id,
      firstName: 'Dr. Sarah',
      lastName: 'Smith',
      licenseNumber: 'MD123456',
      specialization: ['Internal Medicine', 'Cardiology'],
      qualification: ['MD', 'FACC'],
      experience: 10,
      phoneNumber: '+1234567892',
      hospitalAffiliation: ['City General Hospital', 'Heart Center'],
      consultationFee: 150.00,
    },
  });

  console.log('✅ Created doctor profile:', doctor.firstName, doctor.lastName);

  // Create sample medical records
  const medicalRecords = [
    {
      patientId: patient.id,
      doctorId: doctor.id,
      recordType: RecordType.consultation,
      title: 'Annual Health Checkup',
      description: 'Routine annual physical examination with comprehensive health assessment.',
      diagnosis: ['Hypertension - Stage 1', 'Vitamin D Deficiency'],
      symptoms: ['Mild headaches', 'Fatigue'],
      medications: [
        {
          name: 'Lisinopril',
          dosage: '10mg',
          frequency: 'Once daily',
          duration: '3 months'
        },
        {
          name: 'Vitamin D3',
          dosage: '2000 IU',
          frequency: 'Once daily',
          duration: '6 months'
        }
      ],
      labResults: [
        {
          test: 'Complete Blood Count',
          result: 'Normal',
          date: new Date().toISOString()
        },
        {
          test: 'Lipid Panel',
          result: 'Cholesterol: 220 mg/dL (Borderline)',
          date: new Date().toISOString()
        }
      ],
      notes: 'Patient is generally healthy. Recommend lifestyle modifications for blood pressure control.',
      visitDate: new Date(),
      severity: Severity.low,
      shareableViaQr: true,
    },
    {
      patientId: patient.id,
      doctorId: doctor.id,
      recordType: RecordType.lab_report,
      title: 'Blood Work Results',
      description: 'Comprehensive metabolic panel and lipid profile results.',
      diagnosis: ['Borderline High Cholesterol'],
      labResults: [
        {
          test: 'Total Cholesterol',
          result: '220 mg/dL',
          reference: '< 200 mg/dL',
          status: 'High'
        },
        {
          test: 'HDL Cholesterol',
          result: '45 mg/dL',
          reference: '> 40 mg/dL',
          status: 'Normal'
        },
        {
          test: 'LDL Cholesterol',
          result: '150 mg/dL',
          reference: '< 100 mg/dL',
          status: 'High'
        }
      ],
      notes: 'Recommend dietary changes and follow-up in 3 months.',
      visitDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      severity: Severity.low,
      shareableViaQr: true,
    },
    {
      patientId: patient.id,
      doctorId: doctor.id,
      recordType: RecordType.prescription,
      title: 'Hypertension Medication',
      description: 'Prescription for blood pressure management.',
      diagnosis: ['Essential Hypertension'],
      medications: [
        {
          name: 'Lisinopril',
          dosage: '10mg',
          frequency: 'Once daily in the morning',
          duration: '90 days',
          instructions: 'Take with or without food. Monitor blood pressure regularly.'
        }
      ],
      notes: 'Start with lowest effective dose. Monitor for dry cough or dizziness.',
      visitDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
      severity: Severity.medium,
      shareableViaQr: true,
    }
  ];

  const createdRecords: any[] = [];
  for (const recordData of medicalRecords) {
    const record = await prisma.medicalRecord.create({
      data: recordData,
    });
    createdRecords.push(record);
    console.log('✅ Created medical record:', record.title);
  }

  // Create QR share token for testing AI functionality
  const qrToken = await prisma.qrShareToken.create({
    data: {
      token: '45bc2f44-fda8-4ab5-a3f5-baa5e33923a6', // Use the UUID from frontend logs
      userId: patient.userId,
      recordIds: createdRecords.map(r => r.id), // Use actual record IDs
      shareType: 'full',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      blockchainHash: 'demo_hash_' + Date.now(),
      facilityId: 'default-facility',
    },
  });

  console.log('✅ Created QR share token:', qrToken.token);

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
