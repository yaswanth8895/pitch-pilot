# PitchPilot Voice Integration Handoff

This document is the contract between the PitchPilot Agency/UI application and the independently maintained voice application.

The hackathon goal is one reliable outbound call. Keep the voice application intentionally small.

## Agreed stack

| Area | Technology | Owner | Hosting |
|---|---|---|---|
| Dashboard | Next.js 15, React, TypeScript, Tailwind CSS, shadcn/ui | Agency/UI developer | Cloudflare Pages |
| Data and orchestration | Convex queries, mutations, actions, and HTTP actions | Agency/UI developer | Convex |
| Product extraction | Linkup Fetch API | Agency/UI developer | Called from Convex |
| AI processing | Hermes API | Agency/UI developer | Called from Convex |
| Voice adapter | TypeScript Cloudflare Worker | Voice developer | Cloudflare Workers |
| Calling and realtime agent | ElevenLabs Agents with a Twilio phone number | Voice developer | Managed by ElevenLabs and Twilio |
| Final call transcription | Wispr Flow Voice Interface REST API | Voice developer | Managed by Wispr Flow |

Do not add Azure, a custom persistent server, Docker, Redis, queues, Twilio Media Streams, or custom WebSocket/audio infrastructure. Use the native ElevenLabs Twilio integration.

ElevenLabs and Wispr Flow are mandatory. Do not substitute Vapi, Retell, or an unofficial Wispr SDK.

## Ownership

### Agency/UI developer

Owns:

- Next.js dashboard and Cloudflare Pages deployment
- Convex schema, queries, mutations, actions, and HTTP actions
- Landing-page extraction and product knowledge
- CSV import and lead creation
- Lead strategy generation
- Lead-state validation
- Transcript storage and Hermes CRM processing
- Live activity feed and lead details
- The Convex endpoints described below

Does not own telephony, audio, speech recognition, speech synthesis, provider assistant configuration, or phone-number setup.

### Voice developer

Owns:

- ElevenLabs account, agent, and native Twilio integration
- Twilio account and outbound-capable phone number
- Wispr Flow Developer Platform access and API key
- The Cloudflare Worker voice adapter
- `POST /start-call` and `GET /health`
- Retrieving lead context from Convex
- Passing concise dynamic variables to ElevenLabs
- Receiving ElevenLabs call events and retrieving the completed call audio
- Sending the completed call audio to the official Wispr Flow API
- Forwarding the final transcript or failure to Convex
- Voice deployment and real-call testing

The voice application must not determine the CRM state or meeting status. Convex and Hermes own that decision.

## System flow

```text
Next.js UI
  -> Convex start-call action
  -> Voice Worker POST /start-call { leadId }
  -> Voice Worker GETs lead context from Convex
  -> Voice Worker creates an ElevenLabs outbound call
  -> ElevenLabs calls the lead through its native Twilio integration
  -> ElevenLabs posts the completed call event to the Voice Worker
  -> Voice Worker sends the completed call audio to Wispr Flow
  -> Voice Worker sends the Wispr transcript or failure to Convex
  -> Convex processes and stores the result
  -> Next.js UI updates through its Convex subscription
```

The browser never calls the voice Worker directly and never receives the shared secret.

## Authentication

Every request between Convex and the voice Worker must contain:

```http
X-Shared-Secret: <VOICE_SHARED_SECRET>
```

Generate one random secret and store the same value in Convex and Cloudflare Worker secrets. Never commit it or expose it through a `NEXT_PUBLIC_` variable.

For the hackathon, no additional authentication system is required.

## Agency to voice contract

The Agency application has one functional voice endpoint.

### Start a call

```http
POST https://<voice-worker>/start-call
Content-Type: application/json
X-Shared-Secret: <VOICE_SHARED_SECRET>

{
  "leadId": "<convex-lead-id>"
}
```

Do not send lead information, product knowledge, strategy, or transcripts in this request.

Successful response:

```http
HTTP/1.1 202 Accepted
Content-Type: application/json

{
  "accepted": true,
  "callId": "<elevenlabs-conversation-id>"
}
```

Error response:

```json
{
  "accepted": false,
  "error": "Readable explanation"
}
```

Use these status codes:

- `202`: call accepted
- `400`: invalid JSON or missing `leadId`
- `401`: missing or invalid shared secret
- `404`: lead not found
- `409`: lead already called or another call is active
- `502`: ElevenLabs, Twilio, or Wispr Flow rejected the request

### Health check

```http
GET https://<voice-worker>/health
```

Response:

```json
{
  "ok": true
}
```

The health endpoint is for deployment checks only.

## Voice to Agency contract

Convex exposes these HTTP Actions from its `.convex.site` URL.

### Get lead context

```http
GET https://<convex-deployment>.convex.site/voice/context?leadId=<lead-id>
X-Shared-Secret: <VOICE_SHARED_SECRET>
```

Successful response:

```json
{
  "leadId": "...",
  "name": "Jane Doe",
  "phone": "+15551234567",
  "company": "Acme",
  "strategy": "Call strategy...",
  "productKnowledge": {
    "summary": "...",
    "features": ["..."],
    "pricing": ["..."],
    "objections": ["..."],
    "faq": [
      {
        "question": "...",
        "answer": "..."
      }
    ],
    "benefits": ["..."]
  }
}
```

Return `401` for an invalid secret and `404` for an unknown or ineligible lead.

### Complete a call

```http
POST https://<convex-deployment>.convex.site/voice/completed
Content-Type: application/json
X-Shared-Secret: <VOICE_SHARED_SECRET>

{
  "leadId": "...",
  "callId": "...",
  "transcript": "Final Wispr Flow transcript",
  "transcriptProvider": "wispr-flow",
  "endedReason": "customer-ended-call"
}
```

Successful response:

```json
{
  "accepted": true
}
```

Convex is responsible for storing the transcript, calling the Hermes CRM Agent, updating the summary, final state, meeting flag, and activity history.

Send only the final Wispr Flow transcript. Do not forward every partial transcript event to Convex. The ElevenLabs transcript may be retained temporarily for debugging but is not the authoritative CRM transcript.

### Report a call failure

```http
POST https://<convex-deployment>.convex.site/voice/failed
Content-Type: application/json
X-Shared-Secret: <VOICE_SHARED_SECRET>

{
  "leadId": "...",
  "callId": "...",
  "reason": "Provider rejected destination number"
}
```

Successful response:

```json
{
  "accepted": true
}
```

Convex will mark the lead `FAILED` and append the failure to its history.

## ElevenLabs and Wispr Flow behavior

The Worker should perform this sequence:

```text
Validate POST /start-call
  -> fetch context from Convex
  -> create one ElevenLabs outbound call
  -> return the ElevenLabs conversation ID
```

Pass only concise dynamic variables to the ElevenLabs agent:

```json
{
  "lead_name": "Jane Doe",
  "company": "Acme",
  "product_summary": "...",
  "strategy": "...",
  "objections": "...",
  "call_goal": "Qualify interest and book a meeting"
}
```

Configure ElevenLabs to send completed-call events to a Worker route such as `POST /webhooks/elevenlabs`.

The Worker needs to handle only:

- Call status events needed for debugging
- End-of-call notification and completed call audio
- Provider or call failure

After the call ends, the Worker must:

1. Retrieve the completed call recording from ElevenLabs.
2. Convert it to base64-encoded, mono, 16-bit PCM WAV at 16 kHz if necessary.
3. Send it to the official Wispr Flow REST transcription endpoint.
4. Send the returned Wispr text to Convex through `/voice/completed`.

Use the REST API because the demo needs only a final post-call transcript. Do not add a Wispr WebSocket pipeline or live transcript streaming.

Wispr Flow currently limits a REST transcription request to 25 MB or six minutes. Keep the demo call under three minutes.

## Voice repository

The voice developer should use a separate repository with this minimal shape:

```text
pitch-pilot-voice/
├── src/
│   └── index.ts
├── wrangler.jsonc
├── package.json
├── README.md
└── .env.example
```

Recommended dependencies are limited to Cloudflare Worker tooling and a small validator or audio conversion library only if required. Direct `fetch` calls to ElevenLabs, Wispr Flow, and Convex are sufficient.

## Environment variables

Voice Worker secrets:

```text
ELEVENLABS_API_KEY=
ELEVENLABS_AGENT_ID=
ELEVENLABS_PHONE_NUMBER_ID=
WISPR_FLOW_API_KEY=
CONVEX_SITE_URL=
VOICE_SHARED_SECRET=
```

Agency/Convex variables:

```text
VOICE_SERVICE_URL=
VOICE_SHARED_SECRET=
```

Do not put any of these values in Git.

## Implementation order

### Stage 1: Contract test without external voice services

1. Agency developer deploys minimal Convex voice endpoints with a synthetic lead.
2. Voice developer deploys `/health` and a fake `/start-call` implementation.
3. The Worker retrieves the synthetic lead from `/voice/context`.
4. The Worker posts a fake transcript to `/voice/completed`.
5. Confirm that Convex stores the result and the dashboard updates.

Do not start ElevenLabs or Wispr Flow integration until this round trip works.

### Stage 2: ElevenLabs call

1. Replace the fake call with an ElevenLabs outbound-call request.
2. Call one approved test phone number.
3. Confirm that the phone rings and the assistant speaks.
4. Confirm that ElevenLabs sends its completed-call event to the Worker.
5. Confirm that the Worker can retrieve the completed call audio.

### Stage 3: Wispr Flow transcription

1. Convert the completed call audio to the Wispr Flow input format.
2. Send the audio through the official Wispr Flow REST API.
3. Confirm that Wispr returns a final transcript.
4. Forward that transcript to Convex with `transcriptProvider: "wispr-flow"`.
5. Confirm that the dashboard updates.

### Stage 4: Demo hardening

Test only:

- Successful call
- Invalid phone number
- Provider failure
- Duplicate call attempt
- Attempt to start a second simultaneous call

Prepare a short recording of the successful flow as a fallback.

## Definition of done for the voice developer

- [ ] `GET /health` returns `{ "ok": true }` from the deployed Worker.
- [ ] `POST /start-call` validates the secret and accepts only `{ leadId }`.
- [ ] The Worker retrieves context from Convex.
- [ ] ElevenLabs places one real outbound call through the configured Twilio number.
- [ ] The ElevenLabs webhook reaches the Worker.
- [ ] The Worker retrieves and converts the completed call audio.
- [ ] The official Wispr Flow API produces the final transcript.
- [ ] The Worker sends the Wispr transcript to Convex.
- [ ] Failures are sent to `/voice/failed` with a readable reason.
- [ ] No credentials are committed.
- [ ] The deployed Worker URL and required variable names are documented.

## Change rule

This file is the shared contract. Either contributor may propose a change, but both contributors must agree before changing an endpoint, header, payload, or ownership boundary.
