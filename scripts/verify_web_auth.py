"""Exercise the built web routes with isolated sessions; never print credentials.

Run against a local production build or deployed origin. Uses the existing ignored
reviewer credential file, creates its own session and invalidates it afterwards.
No call records are created, modified, downloaded or printed.
"""
import argparse
from pathlib import Path
from urllib.parse import parse_qs, urlparse
import httpx

ROUTES = ["/portal", "/portal/data-model", "/portal/voice-test", "/portal?call=auth-smoke"]

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("origin")
    args = parser.parse_args()
    credentials = (Path(__file__).resolve().parents[1] / ".local/reviewer-credentials.txt").read_text()
    password = credentials.split("Password: ", 1)[1].splitlines()[0].strip()
    username = credentials.split("Username: ", 1)[1].splitlines()[0].strip()
    checks = 0
    with httpx.Client(base_url=args.origin.rstrip("/"), timeout=25, follow_redirects=False) as client:
        for forged in (False, True):
            if forged: client.cookies.set("clinic_session", "forged-session")
            for path in ROUTES:
                response = client.get(path)
                assert response.status_code in (302, 303, 307, 308), (path, response.status_code)
                location = urlparse(response.headers["location"])
                assert location.path == "/login"
                assert parse_qs(location.query).get("next") == [path]
                assert "Supabase PostgreSQL" not in response.text
                checks += 1
        client.cookies.clear()
        public = client.get("/try")
        assert public.status_code == 200 and "workspace-nav" not in public.text
        assert client.get("/login?next=https://untrusted.example").status_code == 200
        checks += 2
        login = client.post("/api/auth/login", json={"username": username, "password": password}, headers={"Origin": args.origin.rstrip("/")})
        login.raise_for_status()
        csrf = login.json()["csrf_token"]
        token = client.cookies.get("clinic_session")
        try:
            for path in ROUTES[:3]:
                response = client.get(path)
                assert response.status_code == 200, (path, response.status_code)
                assert "no-store" in response.headers.get("cache-control", "")
                checks += 1
            for requested, expected in (("/portal/data-model", "/portal/data-model"), ("https://untrusted.example", "/portal"), ("//untrusted.example", "/portal")):
                response = client.get("/login", params={"next": requested})
                assert response.status_code in (302, 303, 307, 308)
                assert urlparse(response.headers["location"]).path == expected
                checks += 1
        finally:
            client.post("/api/auth/logout", headers={"X-CSRF-Token": csrf, "Origin": args.origin.rstrip("/")}).raise_for_status()
        client.cookies.clear()
        client.cookies.set("clinic_session", token)
        assert urlparse(client.get("/portal/data-model").headers["location"]).path == "/login"
        checks += 1
    print(f"PASS: {checks} web authentication checks (anonymous, forged, valid, revoked, public caller, safe login).")

if __name__ == "__main__": main()
