import { Router, Request, Response } from 'express';
import { twilioService } from '../services/twilio.service';
import { gameService } from '../services/game.service';
import { sessionService } from '../services/session.service';
import { logger } from '../middleware/error-handler';

const router = Router();

/**
 * POST /voice
 * Main webhook endpoint for Twilio voice calls
 */
router.post('/voice', async (req: Request, res: Response): Promise<void> => {
  try {
    const { Caller, Digits } = req.query;

    if (!Caller || typeof Caller !== 'string') {
      res.status(400).send(twilioService.createSayResponse('Invalid caller information'));
      return;
    }

    const userId = gameService.formatUserId(Caller, 'caller');

    // Handle DTMF input
    if (Digits && typeof Digits === 'string') {
      await handleDtmfInput(userId, Digits.toString(), req, res);
    } else {
      // Initial greeting
      const twiml = twilioService.createSayAndGatherResponse({
        sayText: 'Get ready!',
        gatherText: 'Enter your game pin.',
      });
      res.type('text/xml').send(twiml);
    }
  } catch (error) {
    logger.error({ error }, 'Error in voice webhook');
    const twiml = twilioService.createSayResponse('An error occurred. Please try again later.');
    res.type('text/xml').send(twiml);
  }
});

/**
 * GET /voice
 * Alternative method for voice webhook (for testing)
 */
router.get('/voice', async (req: Request, res: Response): Promise<void> => {
  try {
    const { Caller, Digits } = req.query;

    if (!Caller || typeof Caller !== 'string') {
      res.status(400).send(twilioService.createSayResponse('Invalid caller information'));
      return;
    }

    const userId = gameService.formatUserId(Caller, 'caller');

    // Handle DTMF input
    if (Digits && typeof Digits === 'string') {
      await handleDtmfInput(userId, Digits.toString(), req, res);
    } else {
      // Initial greeting
      const twiml = twilioService.createSayAndGatherResponse({
        sayText: 'Get ready!',
        gatherText: 'Enter your game pin.',
      });
      res.type('text/xml').send(twiml);
    }
  } catch (error) {
    logger.error({ error }, 'Error in voice webhook');
    const twiml = twilioService.createSayResponse('An error occurred. Please try again later.');
    res.type('text/xml').send(twiml);
  }
});

/**
 * Handle DTMF digit input
 */
async function handleDtmfInput(
  userId: string,
  digits: string,
  _req: Request,
  res: Response
): Promise<void> {
  const hasActiveSession = gameService.hasActiveSession(userId);

  // Handle disconnect command (*)
  if (digits.includes('*')) {
    await sessionService.handleUserDisconnection(userId);
    const twiml = twilioService.createSayResponse('Removing your game session!');
    res.type('text/xml').send(twiml);
    return;
  }

  // Handle invalid input (more than one digit or invalid digit)
  if (!digits || digits.length <= 0 || digits.length > 1) {
    const twiml = twilioService.createSayAndGatherResponse({
      sayText: 'Please only enter one digit at a time!',
      gatherText: 'Choose your next move.',
    });
    res.type('text/xml').send(twiml);
    return;
  }

  // Handle game PIN entry (first time or setting PIN)
  if (!hasActiveSession) {
    const pin = digits;
    const pinSpoken = pin.split('').join(' ');

    // Create session and connect
    await sessionService.handleUserConnection(userId, pin);

    const twiml = twilioService.createSayAndGatherResponse({
      sayText: `Setting your game code to ${pinSpoken}.`,
      gatherText:
        'Remember, use 2 for up, 8 for down, 4 for left, and 6 for right.',
    });
    res.type('text/xml').send(twiml);
    return;
  }

  // Handle movement commands
  const direction = gameService.digitToDirection(digits);

  if (!direction) {
    // Invalid move
    const twiml = twilioService.createHangupResponse(
      'You selected an invalid move. Goodbye.'
    );
    res.type('text/xml').send(twiml);
    return;
  }

  // Send movement to game server
  await sessionService.movePlayer(userId, direction);

  const twiml = twilioService.createSayAndGatherResponse({
    sayText: `Moving ${direction}`,
    gatherText: 'Choose your next move.',
  });
  res.type('text/xml').send(twiml);
}

export default router;
