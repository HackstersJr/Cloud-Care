#!/usr/bin/env node

/**
 * Create Sample Patient Data Script
 * 
 * This script creates sample patient records and medical records for testing the MyRecords page.
 * It creates a patient profile for the current test user and adds some sample medical records.
 */

const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

// Database configuration for Docker environment
const dbConfig = {
  host: '192.168.137.1', // Docker host IP
  port: 5432,
  database: 'cloudcare_db',
  user: 'postgres',
  password: 'cloudcare_dev_password'
};

async function createSamplePatientData() {
  const pool = new Pool(dbConfig);
  
  try {
    console.log('🔄 Connecting to database...');
    
    // Get a user with role 'patient' that doesn't have a patient record
    const userQuery = `
      SELECT u.id, u.email, u.role 
      FROM users u 
      LEFT JOIN patients p ON u.id = p.user_id 
      WHERE u.role = 'patient' AND p.id IS NULL 
      LIMIT 1
    `;
    
    const userResult = await pool.query(userQuery);
    
    if (userResult.rows.length === 0) {
      console.log('❌ No patient users found without patient records');
      return;
    }
    
    const user = userResult.rows[0];
    console.log(`📋 Found user: ${user.email} (${user.id})`);
    
    // Create patient record
    const patientId = uuidv4();
    const createPatientQuery = `
      INSERT INTO patients (
        id, user_id, first_name, last_name, date_of_birth, gender, 
        phone_number, address, blood_type, allergies, chronic_conditions,
        preferred_language, marital_status, occupation
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
      )
    `;
    
    const patientData = [
      patientId,
      user.id,
      'John',
      'Doe',
      '1990-01-15',
      'male',
      '+1-555-123-4567',
      JSON.stringify({
        street: '123 Healthcare Ave',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400001',
        country: 'India'
      }),
      'O+',
      ['Peanuts', 'Shellfish'],
      ['Hypertension'],
      'en',
      'single',
      'Software Engineer'
    ];
    
    await pool.query(createPatientQuery, patientData);
    console.log(`✅ Created patient record: ${patientId}`);
    
    // Create sample medical records
    const sampleRecords = [
      {
        id: uuidv4(),
        recordType: 'lab_report',
        title: 'Complete Blood Count (CBC)',
        description: 'Routine blood work showing normal values across all parameters. White blood cell count, red blood cell count, and platelet count all within normal ranges.',
        diagnosis: JSON.stringify(['Normal blood parameters']),
        visitDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        severity: 'low',
        confidentialityLevel: 'normal'
      },
      {
        id: uuidv4(),
        recordType: 'prescription',
        title: 'Blood Pressure Medication',
        description: 'Prescribed Lisinopril 10mg daily for mild hypertension management. Patient advised to monitor blood pressure daily.',
        diagnosis: JSON.stringify(['Mild Hypertension']),
        medications: JSON.stringify([
          {
            name: 'Lisinopril',
            dosage: '10mg',
            frequency: 'Once daily',
            duration: '30 days'
          }
        ]),
        visitDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
        severity: 'medium',
        confidentialityLevel: 'normal'
      },
      {
        id: uuidv4(),
        recordType: 'imaging',
        title: 'Chest X-Ray',
        description: 'Chest X-ray performed due to persistent cough. Results show clear lungs with no signs of infection or abnormalities.',
        diagnosis: JSON.stringify(['Clear chest X-ray', 'No respiratory infection']),
        imagingResults: JSON.stringify([
          {
            type: 'X-Ray',
            bodyPart: 'Chest',
            findings: 'Normal lung fields, no infiltrates or masses detected',
            radiologist: 'Dr. Sarah Johnson'
          }
        ]),
        visitDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), // 21 days ago
        severity: 'low',
        confidentialityLevel: 'normal'
      },
      {
        id: uuidv4(),
        recordType: 'general',
        title: 'Annual Physical Examination',
        description: 'Comprehensive annual health checkup including vital signs, physical examination, and health counseling.',
        diagnosis: JSON.stringify(['Good overall health', 'Mild hypertension noted']),
        symptoms: JSON.stringify(['No acute symptoms', 'Occasional headaches']),
        notes: 'Patient reports feeling well overall. Recommend lifestyle modifications for blood pressure management including diet and exercise.',
        visitDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        severity: 'low',
        confidentialityLevel: 'normal'
      },
      {
        id: uuidv4(),
        recordType: 'discharge_summary',
        title: 'Emergency Room Visit',
        description: 'Patient presented with chest pain. EKG and blood work performed. Diagnosed with anxiety-related chest pain.',
        diagnosis: JSON.stringify(['Anxiety-related chest pain', 'Ruled out cardiac event']),
        symptoms: JSON.stringify(['Chest pain', 'Shortness of breath', 'Anxiety']),
        labResults: JSON.stringify([
          {
            test: 'Troponin I',
            result: 'Negative',
            range: '< 0.04 ng/mL'
          },
          {
            test: 'EKG',
            result: 'Normal sinus rhythm',
            range: 'Normal'
          }
        ]),
        notes: 'Patient discharged with anxiety management plan and follow-up recommendations.',
        visitDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
        severity: 'medium',
        confidentialityLevel: 'restricted'
      }
    ];
    
    // Insert medical records
    for (const record of sampleRecords) {
      const insertRecordQuery = `
        INSERT INTO medical_records (
          id, patient_id, record_type, title, description, diagnosis, symptoms,
          medications, lab_results, imaging_results, notes, visit_date,
          severity, status, confidentiality_level, shareable_via_qr,
          created_at, updated_at, is_active
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
        )
      `;
      
      const recordData = [
        record.id,
        patientId,
        record.recordType,
        record.title,
        record.description,
        record.diagnosis,
        record.symptoms || null,
        record.medications || null,
        record.labResults || null,
        record.imagingResults || null,
        record.notes || null,
        record.visitDate,
        record.severity,
        'active',
        record.confidentialityLevel,
        false, // shareable_via_qr
        new Date(),
        new Date(),
        true
      ];
      
      await pool.query(insertRecordQuery, recordData);
      console.log(`✅ Created medical record: ${record.title}`);
    }
    
    console.log(`🎉 Successfully created patient profile and ${sampleRecords.length} medical records!`);
    console.log(`📧 Patient email: ${user.email}`);
    console.log(`🆔 Patient ID: ${patientId}`);
    
  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  } finally {
    await pool.end();
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
