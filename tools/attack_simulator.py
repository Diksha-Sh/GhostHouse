import argparse
import json
import time
import urllib.request
import urllib.error


def send_request(url, method="GET", data=None):
    try:
        headers = {
            "Content-Type": "application/json"
        }

        body = None

        if data is not None:
            body = json.dumps(data).encode("utf-8")

        request = urllib.request.Request(
            url,
            data=body,
            headers=headers,
            method=method
        )

        start = time.time()

        with urllib.request.urlopen(request, timeout=10) as response:
            elapsed = (time.time() - start) * 1000

            print(
                f"[{response.status}] "
                f"{method} {url} "
                f"({elapsed:.0f} ms)"
            )

    except urllib.error.HTTPError as error:
        elapsed = (time.time() - start) * 1000

        print(
            f"[{error.code}] "
            f"{method} {url} "
            f"({elapsed:.0f} ms)"
        )

    except Exception as error:
        print(f"[ERROR] {method} {url} -> {error}")


def normal_probe(target):
    print("\n=== NORMAL PROBE ===")

    send_request(
        f"{target}/login",
        "POST",
        {
            "username": "testuser",
            "password": "Test@123"
        }
    )


def brute_force(target):
    print("\n=== BRUTE FORCE SIMULATION ===")

    passwords = [
        "password123",
        "admin123",
        "test123",
        "welcome123",
        "qwerty123",
        "letmein123",
        "ghost123",
        "password1"
    ]

    for password in passwords:
        send_request(
            f"{target}/login",
            "POST",
            {
                "username": "admin",
                "password": password
            }
        )

        time.sleep(0.3)


def scanner(target):
    print("\n=== SCANNER SIMULATION ===")

    paths = [
        "/",
        "/login",
        "/dashboard",
        "/admin",
        "/users",
        "/api-keys",
        "/robots.txt",
        "/.env",
        "/config",
        "/api"
    ]

    for path in paths:
        send_request(
            f"{target}{path}",
            "GET"
        )

        time.sleep(0.2)


def sqli(target):
    print("\n=== SQL INJECTION SIMULATION ===")

    payloads = [
        "' OR '1'='1",
        "' OR 1=1 --",
        "admin'--",
        "' UNION SELECT NULL --"
    ]

    for payload in payloads:
        send_request(
            f"{target}/login",
            "POST",
            {
                "username": payload,
                "password": "test"
            }
        )

        time.sleep(0.4)


def main():
    parser = argparse.ArgumentParser(
        description="Ghost House attack simulation tool"
    )

    parser.add_argument(
        "--target",
        required=True,
        help="Base URL of your Ghost House deployment"
    )

    parser.add_argument(
        "--mode",
        required=True,
        choices=[
            "normal",
            "brute",
            "scanner",
            "sqli"
        ],
        help="Simulation mode"
    )

    args = parser.parse_args()

    target = args.target.rstrip("/")

    if args.mode == "normal":
        normal_probe(target)

    elif args.mode == "brute":
        brute_force(target)

    elif args.mode == "scanner":
        scanner(target)

    elif args.mode == "sqli":
        sqli(target)


if __name__ == "__main__":
    main()