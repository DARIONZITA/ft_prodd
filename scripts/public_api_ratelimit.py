import requests
import random
import string

BASE_URL = "http://localhost:3001"


def random_string(n=8):
    return "".join(random.choices(string.ascii_lowercase + string.digits, k=n))


def register_user():
    email = f"{random_string()}@test.com"
    username = f"user_{random_string()}"
    password = "Test1234!"

    res = requests.post(
        f"{BASE_URL}/api/auth/signup",
        json={
            "email": email,
            "username": username,
            "password": password
        }
    )

    if res.status_code != 201:
        raise Exception(f"Signup falhou: {res.status_code} - {res.text}")

    data = res.json()

    return data["token"]


def create_api_key(token):
    res = requests.post(
        f"{BASE_URL}/api/keys",
        headers={
            "Authorization": f"Bearer {token}"
        },
        json={"name": f"key_{random_string()}"}
    )

    if res.status_code != 201:
        raise Exception(f"Falha ao criar API key: {res.status_code} - {res.text}")

    data = res.json()

    # CORREÇÃO: key está dentro de data
    return data["data"]["key"]


def test_get(api_key):
    count = 0
    max_requests = 10000

    while count < max_requests:
        res = requests.get(
            f"{BASE_URL}/api/public/workspaces",
            headers={
                "X-API-Key": api_key
            }
        )

        count += 1

        if res.status_code == 429:
            print(f"GET limit atingido: {count}")
            break
        print(f"GET {count} - Status: {res.status_code}")


def test_post(api_key):
    count = 0
    max_requests = 10000

    while count < max_requests:
        res = requests.post(
            f"{BASE_URL}/api/public/workspaces",
            headers={
                "X-API-Key": api_key
            },
            json={
                "name": f"workspace_{random_string()}",
                "minLength": 1,
                "maxLength": 10
            }
        )

        count += 1

        if res.status_code == 429:
            print(f"POST limit atingido: {count}")
            break
        print(f"POST {count} - Status: {res.status_code}")


def main():
    try:
        print("Criando utilizador...")
        token = register_user()

        print("Criando API key...")
        api_key = create_api_key(token)

        print("Testando GET rate limit...")
        test_get(api_key)

        print("Testando POST rate limit...")
        test_post(api_key)

        print("Fim dos testes.")

    except Exception as e:
        print("Erro:", str(e))


if __name__ == "__main__":
    main()