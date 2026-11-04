from typing import Literal
from pydantic import BaseModel, ConfigDict, Field


class Input(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class ExtractionInput(Input):
    patient_name: str | None = Field(None, max_length=180)
    phone: str | None = Field(None, max_length=40)
    reason_for_visit: str | None = Field(None, max_length=2000)
    preferred_datetime: str | None = Field(None, max_length=80)
    doctor_id: str | None = Field(None, max_length=80)
    service_id: str | None = Field(None, max_length=80)
    intent: Literal["booking", "reschedule", "cancellation", "enquiry", "follow_up"] | None = None
    notes: str | None = Field(None, max_length=2000)


class BookingInput(Input):
    patient_name: str = Field(min_length=2, max_length=180)
    phone: str = Field(min_length=8, max_length=40)
    reason: str = Field(min_length=2, max_length=2000)
    service_id: str = Field(max_length=80)
    doctor_id: str = Field(max_length=80)
    slot: str = Field(max_length=80)
    confirmed: bool = False


class LookupInput(Input):
    reference: str = Field(min_length=5, max_length=24)
    phone: str = Field(min_length=8, max_length=40)


class ChangeInput(LookupInput):
    expected_version: int = Field(ge=1)
    confirmed: bool = False
    new_slot: str | None = Field(None, max_length=80)


class FollowUpInput(Input):
    patient_name: str = Field(min_length=2, max_length=180)
    phone: str = Field(min_length=8, max_length=40)
    reason: str = Field(min_length=2, max_length=2000)
    confirmed: bool = False


class TurnInput(Input):
    id: str = Field(min_length=1, max_length=120)
    speaker: Literal["user", "assistant"]
    text: str = Field(min_length=1, max_length=20000)
    timestamp: str
    interrupted: bool = False


class EndCallInput(Input):
    failed: bool = False
    error_code: str | None = Field(None, max_length=80)
