"""Explicit local scripted test data. These are not actual voice conversations."""
import argparse
from datetime import datetime, timedelta, timezone
from sqlalchemy import select
from backend.database import Base, make_engine, make_sessions
from backend.models import Call
from backend.schemas import BookingInput, ExtractionInput, FollowUpInput, TurnInput
from backend.service import ClinicService, DHaka


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--confirm-test-data", action="store_true", required=True)
    parser.parse_args()
    engine = make_engine()
    if engine.dialect.name != "sqlite":
        raise RuntimeError("This fixture helper is restricted to local SQLite development")
    Base.metadata.create_all(engine)
    sessions = make_sessions(engine)
    base = datetime.now(timezone.utc) - timedelta(minutes=4)
    current = [base]
    service = ClinicService(sessions, lambda: current[0])
    day = (base.astimezone(DHaka) + timedelta(days=1)).date()
    if day.weekday() == 4:
        day += timedelta(days=1)
    slot = f"{day.isoformat()}T11:00:00+06:00"
    scenarios = [
        ("booked", [("assistant", "ঢাকা ডেন্টাল কেয়ারের ডেমোতে স্বাগতম। কীভাবে সাহায্য করতে পারি?"),
            ("user", "আমি স্কেলিংয়ের জন্য একটা অ্যাপয়েন্টমেন্ট নিতে চাই।"),
            ("assistant", "আপনার নাম আর মোবাইল নম্বরটা বলবেন?"),
            ("user", "ডেমো রোগী এক। নম্বর শূন্য এক সাত এক দুই তিন চার পাঁচ ছয় সাত আট।"),
            ("assistant", "আগামীকাল সকাল এগারোটায় ডা. নাদিয়া রহমানের কাছে স্কেলিং। বুকিংটা নিশ্চিত করব?"),
            ("user", "জি, নিশ্চিত করুন।")]),
        ("callback", [("assistant", "কীভাবে সাহায্য করতে পারি?"), ("user", "দাঁতের ব্যথার জন্য কী ওষুধ খাব?"),
            ("assistant", "আমি চিকিৎসা পরামর্শ দিতে পারি না। চাইলে স্টাফের সঙ্গে কথা বলার অনুরোধ রাখতে পারি।"),
            ("user", "জি। নাম ডেমো রোগী দুই, নম্বর শূন্য এক নয় এক দুই তিন চার পাঁচ ছয় সাত আট।")]),
        ("incomplete", [("assistant", "কীভাবে সাহায্য করতে পারি?"), ("user", "একটা অ্যাপয়েন্টমেন্ট দরকার। আমার নাম ডেমো রোগী তিন।")]),
    ]
    for index, (kind, turns) in enumerate(scenarios):
        room = f"fixture-{base.date()}-{kind}"
        with sessions() as s:
            if s.scalar(select(Call).where(Call.room_name == room)):
                continue
        current[0] = base + timedelta(seconds=index * 60)
        call_id = service.start_call(room)
        service.activate_call(call_id)
        for n, (speaker, text) in enumerate(turns):
            service.add_turn(call_id, TurnInput(id=f"turn-{n}", speaker=speaker, text=text, timestamp=(current[0] + timedelta(seconds=7*n)).isoformat()))
        if kind == "booked":
            service.book(call_id, BookingInput(patient_name="ডেমো রোগী এক", phone="01712345678", reason="স্কেলিং",
                doctor_id="dr-nadia", service_id="scaling", slot=slot, confirmed=True))
        elif kind == "callback":
            service.follow_up(call_id, FollowUpInput(patient_name="ডেমো রোগী দুই", phone="01912345678", reason="ওষুধ সম্পর্কে জানতে স্টাফের সঙ্গে কথা বলতে চান", confirmed=True))
        else:
            service.capture(call_id, ExtractionInput(patient_name="ডেমো রোগী তিন", intent="booking"))
        current[0] += timedelta(seconds=7*len(turns))
        service.end_call(call_id)
    engine.dispose()
    print("Local scripted fixtures prepared. They are labelled scripted_test, not actual voice calls.")


if __name__ == "__main__":
    main()
