import { Router, Request, Response } from 'express';
import { twilioService } from '../services/twilio.service';
import { gameService } from '../services/game.service';
import { sessionService } from '../services/session.service';
import { logger } from '../middleware/error-handler';

const router = Router();

/**
 * Send TwiML response with correct content type
 */
function sendTwiml(res: Response, twiml: string): void {
  res.type('text/xml').send(twiml);
}

/**
 * Shared voice webhook handler for both GET and POST
 */
async function voiceHandler(req: Request, res: Response): Promise<void> {
  try {
    const { Caller, Digits } = req.query;

    if (!Caller || typeof Caller !== 'string') {
      res.status(400).send(twilioService.createSayResponse('Invalid caller information'));
      return;
    }

    const userId = gameService.formatUserId(Caller, 'caller');

    // Handle DTMF input
    if (Digits && typeof Digits === 'string') {
      await handleDtmfInput(userId, Digits.toString(), res);
    } else {
      // Initial greeting
      const twiml = twilioService.createSayAndGatherResponse({
        sayText: 'Get ready!',
        gatherText: 'Enter your game pin.',
      });
      sendTwiml(res, twiml);
    }
  } catch (error) {
    logger.error({ error }, 'Error in voice webhook');
    const twiml = twilioService.createSayResponse('An error occurred. Please try again later.');
    sendTwiml(res, twiml);
  }
}

router.post('/voice', voiceHandler);
router.get('/voice', voiceHandler);

/**
 * Handle DTMF digit input
 */
async function handleDtmfInput(
  userId: string,
  digits: string,
  res: Response
): Promise<void> {
  const hasActiveSession = gameService.hasActiveSession(userId);

  // Handle disconnect command (*)
  if (digits.includes('*')) {
    await sessionService.handleUserDisconnection(userId);
    sendTwiml(res, twilioService.createSayResponse('Removing your game session!'));
    return;
  }

  // Handle invalid input (more than one digit or invalid digit)
  if (!digits || digits.length <= 0 || digits.length > 1) {
    sendTwiml(res, twilioService.createSayAndGatherResponse({
      sayText: 'Please only enter one digit at a time!',
      gatherText: 'Choose your next move.',
    }));
    return;
  }

  // Handle game PIN entry (first time or setting PIN)
  if (!hasActiveSession) {
    const pin = digits;
    const pinSpoken = pin.split('').join(' ');

    // Create session and connect
    await sessionService.handleUserConnection(userId, pin);

    sendTwiml(res, twilioService.createSayAndGatherResponse({
      sayText: `Setting your game code to ${pinSpoken}.`,
      gatherText:
        'Remember, use 2 for up, 8 for down, 4 for left, and 6 for right.',
    }));
    return;
  }

  // Handle movement commands
  const direction = gameService.digitToDirection(digits);

  if (!direction) {
    // Invalid move
    sendTwiml(res, twilioService.createHangupResponse(
      'You selected an invalid move. Goodbye.'
    ));
    return;
  }

  // Send movement to game server
  await sessionService.movePlayer(userId, direction);

  sendTwiml(res, twilioService.createSayAndGatherResponse({
    sayText: `Moving ${direction}`,
    gatherText: 'Choose your next move.',
  }));
}

export default router;
