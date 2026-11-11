/**
 * IEM Admission Portal - Application Readiness Validation Service
 * Implements White-Box Basis Path Model from PCCCS594 Test Plan Specification
 */

const { DocumentModel, PaymentModel, ApplicantModel } = require('../models/sql-models');

/**
 * Pure Basis Path Decision Function (Basis Path Complexity V(G) = 4)
 * @param {boolean} formComplete 
 * @param {boolean} documentsUploaded 
 * @param {boolean} feePaid 
 * @returns {boolean}
 */
function validateApplicationReadiness(formComplete, documentsUploaded, feePaid) {
  if (!formComplete) {
    return false;
  }
  if (!documentsUploaded) {
    return false;
  }
  if (!feePaid) {
    return false;
  }
  return true;
}

/**
 * Validates whether an application has met all 3 prerequisites in the database
 */
async function checkApplicationReadiness(application) {
  // 1. Check form complete (applicant record has personal and academic marks)
  const applicant = await ApplicantModel.findByUserId(application.userId);
  const formComplete = Boolean(
    applicant &&
    applicant.dateOfBirth &&
    applicant.gender &&
    applicant.address &&
    applicant.tenthPercentage &&
    applicant.twelfthPercentage
  );

  // 2. Check documents uploaded (at least marksheets uploaded)
  const docs = await DocumentModel.findByApplicationId(application.applicationId);
  const docTypes = docs.map(d => d.docType);
  const documentsUploaded = docs.length >= 2 && (docTypes.includes('MARKSHEET_10') || docTypes.includes('MARKSHEET_12'));

  // 3. Check fee payment completed
  const payment = await PaymentModel.findByApplicationId(application.applicationId);
  const feePaid = Boolean(payment && payment.status === 'SUCCESS');

  const isReady = validateApplicationReadiness(formComplete, documentsUploaded, feePaid);

  return {
    formComplete,
    documentsUploaded,
    feePaid,
    isReady,
    uploadedDocumentsCount: docs.length,
    paymentStatus: payment ? payment.status : 'UNPAID',
    transactionId: payment ? payment.transactionId : null
  };
}

module.exports = {
  validateApplicationReadiness,
  checkApplicationReadiness
};
