#!/usr/bin/env node

/**
 * Prisma Sample Patient Data Generator
 * 
 * This script uses Prisma to create sample patient records and medical records
 * for testing the MyRecords page functionality.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSamplePatientData() {
  try {
    console.log('🔄 Connecting to database via Prisma...');
    
    // Find a user with role 'patient' that doesn't have a patient record
    const userWithoutPatient = await prisma.user.findFirst({
      where: {
        role: 'patient',
        patient: null // No associated patient record
      },
      select: {
        id: true,
        email: true,
        role: true
      }
    });

    if (!userWithoutPatient) {
      console.log('❌ No patient users found without patient records');
      
      // Check if there are any patient users at all
      const patientUsers = await prisma.user.findMany({
        where: { role: 'patient' },
        include: { patient: true }
      });
      
      console.log(`📊 Found ${patientUsers.length} patient users total`);
      if (patientUsers.length > 0) {
        console.log('📋 Existing patient users:');
        patientUsers.forEach(user => {
          console.log(`  - ${user.email} (${user.id}) - Has patient record: ${!!user.patient}`);
        });
      }
      
      return;
    }

    console.log(`📋 Found user: ${userWithoutPatient.email} (${userWithoutPatient.id})`);
    
    // Create patient record
    const patient = await prisma.patient.create({
      data: {
        userId: userWithoutPatient.id,
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-01-15'),
        gender: 'male',
        phoneNumber: '+1-555-123-4567',
        address: {
          street: '123 Healthcare Ave',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400001',
          country: 'India'
        },
        bloodType: 'O_POSITIVE',
        allergies: ['Peanuts', 'Shellfish'],
        chronicConditions: ['Hypertension'],
        preferredLanguage: 'en',
        maritalStatus: 'single',
        occupation: 'Software Engineer'
      }
    });

    console.log(`✅ Created patient record: ${patient.id}`);
    
    // Create sample medical records
    const sampleRecords = [
      {
        recordType: 'lab_report',
        title: 'Complete Blood Count (CBC)',
        description: 'Routine blood work showing normal values across all parameters. White blood cell count, red blood cell count, and platelet count all within normal ranges.',
        diagnosis: ['Normal blood parameters'],
        visitDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        severity: 'low',
        confidentialityLevel: 'normal'
      },
      {
        recordType: 'prescription',
        title: 'Blood Pressure Medication',
        description: 'Prescribed Lisinopril 10mg daily for mild hypertension management. Patient advised to monitor blood pressure daily.',
        diagnosis: ['Mild Hypertension'],
        medications: [
          {
            name: 'Lisinopril',
            dosage: '10mg',
            frequency: 'Once daily',
            duration: '30 days',
            prescribedBy: 'Dr. Smith'
          }
        ],
        visitDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
        severity: 'medium',
        confidentialityLevel: 'normal'
      },
      {
        recordType: 'imaging',
        title: 'Chest X-Ray',
        description: 'Chest X-ray performed due to persistent cough. Results show clear lungs with no signs of infection or abnormalities.',
        diagnosis: ['Clear chest X-ray', 'No respiratory infection'],
        imagingResults: [
          {
            type: 'X-Ray',
            bodyPart: 'Chest',
            findings: 'Normal lung fields, no infiltrates or masses detected',
            radiologist: 'Dr. Sarah Johnson',
            datePerformed: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString()
          }
        ],
        visitDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), // 21 days ago
        severity: 'low',
        confidentialityLevel: 'normal'
      },
      {
        recordType: 'general',
        title: 'Annual Physical Examination',
        description: 'Comprehensive annual health checkup including vital signs, physical examination, and health counseling.',
        diagnosis: ['Good overall health', 'Mild hypertension noted'],
        symptoms: ['No acute symptoms', 'Occasional headaches'],
        notes: 'Patient reports feeling well overall. Recommend lifestyle modifications for blood pressure management including diet and exercise.',
        visitDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        severity: 'low',
        confidentialityLevel: 'normal'
      },
      {
        recordType: 'discharge_summary',
        title: 'Emergency Room Visit',
        description: 'Patient presented with chest pain. EKG and blood work performed. Diagnosed with anxiety-related chest pain.',
        diagnosis: ['Anxiety-related chest pain', 'Ruled out cardiac event'],
        symptoms: ['Chest pain', 'Shortness of breath', 'Anxiety'],
        labResults: [
          {
            test: 'Troponin I',
            result: 'Negative',
            range: '< 0.04 ng/mL',
            status: 'Normal'
          },
          {
            test: 'EKG',
            result: 'Normal sinus rhythm',
            range: 'Normal',
            status: 'Normal'
          }
        ],
        notes: 'Patient discharged with anxiety management plan and follow-up recommendations.',
        visitDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
        severity: 'medium',
        confidentialityLevel: 'restricted'
      }
    ];
    
    // Insert medical records
    console.log(`📝 Creating ${sampleRecords.length} medical records...`);
    
    for (const recordData of sampleRecords) {
      const record = await prisma.medicalRecord.create({
        data: {
          patientId: patient.id,
          ...recordData,
          status: 'active'
        }
      });
      
      console.log(`✅ Created medical record: ${record.title} (${record.id})`);
    }
    
    console.log(`🎉 Successfully created patient profile and ${sampleRecords.length} medical records!`);
    console.log(`📧 Patient email: ${userWithoutPatient.email}`);
    console.log(`🆔 Patient ID: ${patient.id}`);
    console.log(`👤 User ID: ${userWithoutPatient.id}`);
    
  } catch (error) {
    console.error('❌ Error creating sample data:', error);
    if (error.code === 'P2002') {
      console.error('💡 This might be a unique constraint violation. The user might already have a patient record.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  createSamplePatientData()
    .then(() => {
      console.log('✨ Sample patient data creation completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { createSamplePatientData };
