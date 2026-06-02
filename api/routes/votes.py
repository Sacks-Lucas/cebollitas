import json
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status

from dependencies import get_current_user
from models.schemas import HasVotedResponse, MyVote, VoteAverage, VoteCreate
from repositories.data_store import events_repo, votes_repo
from services.vote_service import (
    build_voter_hash,
    decrypt_event_scores,
    get_fernet,
    get_user_vote,
    has_voted,
    is_voting_open,
)

router = APIRouter(prefix="/api/votes", tags=["votes"])


@router.post("", status_code=status.HTTP_201_CREATED)
def cast_vote(payload: VoteCreate, current_user: dict = Depends(get_current_user)) -> dict:
    events = events_repo.read()
    event = next((item for item in events if item["id"] == payload.eventId), None)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evento no encontrado.")

    if event.get("eventType") != "monthly_event":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo se pueden votar eventos del mes.",
        )

    if current_user["id"] not in event.get("attendeeIds", []):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo podés votar eventos en los que participaste.",
        )

    if current_user["id"] == event.get("organizerId"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El organizador no puede votar su propio evento.",
        )

    if has_voted(payload.eventId, current_user["id"]):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ya votaste este evento.")

    if not is_voting_open(event):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El período de votación cerró (30 días desde la creación).",
        )

    fernet = get_fernet()
    encrypted_payload = fernet.encrypt(
        json.dumps({"fun": payload.fun, "cost": payload.cost, "originality": payload.originality}).encode()
    ).decode()

    votes = votes_repo.read()
    votes.append(
        {
            "id": str(uuid4()),
            "eventId": payload.eventId,
            "voterIdHash": build_voter_hash(current_user["id"], payload.eventId),
            "encryptedPayload": encrypted_payload,
        }
    )
    votes_repo.write(votes)

    return {"ok": True}


@router.get("/has-voted", response_model=HasVotedResponse)
def check_has_voted(eventId: str = Query(...), current_user: dict = Depends(get_current_user)) -> HasVotedResponse:
    return HasVotedResponse(hasVoted=has_voted(eventId, current_user["id"]))


@router.get("/my-vote", response_model=MyVote | None)
def get_my_vote(eventId: str = Query(...), current_user: dict = Depends(get_current_user)) -> MyVote | None:
    vote = get_user_vote(eventId, current_user["id"])
    if not vote:
        return None
    return MyVote(fun=vote["fun"], cost=vote["cost"], originality=vote["originality"])


@router.get("/{event_id}/average", response_model=VoteAverage)
def get_average(event_id: str, _: dict = Depends(get_current_user)) -> VoteAverage:
    scores = decrypt_event_scores(event_id)
    if not scores:
        return VoteAverage(averageScore=0)
    return VoteAverage(averageScore=round(sum(scores) / len(scores), 2))
