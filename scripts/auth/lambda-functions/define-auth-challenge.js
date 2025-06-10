/**
 * DefineAuthChallenge Lambda Function
 * This determines what challenges the user should face during authentication
 */
exports.handler = async (event) => {
    console.log('DefineAuthChallenge event:', JSON.stringify(event, null, 2));
    
    const { request, response } = event;
    
    // If user doesn't exist, fail
    if (request.userNotFound) {
        response.challengeName = 'CUSTOM_CHALLENGE';
        response.failAuthentication = true;
        response.issueTokens = false;
        return event;
    }
    
    // If this is the first attempt
    if (request.session.length === 0) {
        response.challengeName = 'CUSTOM_CHALLENGE';
        response.failAuthentication = false;
        response.issueTokens = false;
    }
    // If the previous challenge was answered correctly
    else if (request.session.length === 1 && request.session[0].challengeResult === true) {
        response.failAuthentication = false;
        response.issueTokens = true;
    }
    // If the previous challenge was answered incorrectly
    else {
        response.challengeName = 'CUSTOM_CHALLENGE';
        response.failAuthentication = true;
        response.issueTokens = false;
    }
    
    console.log('DefineAuthChallenge response:', JSON.stringify(response, null, 2));
    return event;
};
