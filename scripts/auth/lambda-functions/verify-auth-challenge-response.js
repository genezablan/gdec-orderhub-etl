/**
 * VerifyAuthChallengeResponse Lambda Function
 * This verifies the user's response to the challenge (validates the OTP)
 */
exports.handler = async (event) => {
    console.log('VerifyAuthChallengeResponse event:', JSON.stringify(event, null, 2));
    
    const { request, response } = event;
    
    // For custom authentication, we always check the OTP regardless of challengeName
    // since this function is specifically for verifying the custom challenge
    const userOTP = request.challengeAnswer;
    const correctOTP = request.privateChallengeParameters?.otp;
    
    console.log(`Comparing user OTP: "${userOTP}" with correct OTP: "${correctOTP}"`);
    
    // Verify OTP
    if (userOTP && correctOTP && userOTP === correctOTP) {
        response.answerCorrect = true;
    } else {
        response.answerCorrect = false;
    }
    
    console.log('VerifyAuthChallengeResponse response:', JSON.stringify(response, null, 2));
    return event;
};
