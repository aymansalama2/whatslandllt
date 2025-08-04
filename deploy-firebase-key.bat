@echo off
echo 🔥 Déploiement de la clé Firebase sur le serveur...
echo ================================================

REM Créer le fichier firebase-service-account.json temporaire
echo {> firebase-service-account.json
echo   "type": "service_account",>> firebase-service-account.json
echo   "project_id": "watsland-96923",>> firebase-service-account.json
echo   "private_key_id": "109be9f9a4d60dcf27f72a87cfcae734d04cdaec",>> firebase-service-account.json
echo   "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDI28Qp/IzP5IXw\nyaH3cZC3wVLnY9n1o4nB+b2WqoqHjQ2x772J18j5wdOprEH0zJ2ZBBIXy2LZQlRX\nlclXe5J8hc5zREx5eCjkYgSU8YWxijTNU7NK0R+MqqmroXUcWv6nxtRLNdqcNQdA\nRlhtJROxOAK/GnuBUgfznQv8DbdTvWW0ezCR3EVEE4NZ7ZoDX2Iz86byqrnKCfPT\nD2pbElIeuQGIv8cUqVQvBhkmZp6VntHgFaxBgQvnJdxb892lsH/ILbhl4jc08V9d\n/e+P5qImSAp5dUdyxZQz7HdFVZ3+vcA5cJCOPTWmGAtOvPcFjcytzlDtuS7hD8EB\nHmC9pEfxAgMBAAECggEAEyyZlBmCFrl9yM/yyIScmFIZ+DFZxf+D39LXtKmYmlqO\nh2E3wpApJSCJ9G1XiYc79zbChGd7yvowQ4EuzI1lHUKHxAyt0T21h6HMxqwsw1dK\ndZxrJfYDMUI8esApxhhwrXMHYpukQBu20r20ZMzwjY8ngfdE+YIrdKfWFEx55wIm\n26hLRtZwy/LM5C1/UrnNJ1GljQYkyBCoBIaknrX4H0qlgZvnBY8au/q5PPOzcykT\nUWOPpmywZrpS5V2SWYzgZI0a+yP2Znih0MsvayB7P8Ng66WaTIzGYO4my2j4dez/\ntQTooZuJO1s0CX5xRi72UIm8SetxNuMJWndlMLZ7nQKBgQD3zFgjcfPOhTiZuQVe\nNqU2F8paSOM4dSXmBHs0lBA2Jzi1wpeg1n/MUFPzV6a4pTso3l9o8ZiwTlD+MZiM\nwDAlzgHkNr7rHuPe9jWDe7qMB+CjrOKwpnWxfWYWT2QQ/jh4FBhDDuLQZRcSAXFa\nR8dig8SZUpLXI6kRwDHeOOdZVQKBgQDPgbCVNLTen4cQ1HWjwXgqHtmF1zOm7X2p\nKLT1ttys1IO7MkyqELIrAscr02V7NQ+Kqqlcke1LsW9kyA9m/OCbD95eIfwVt7Zk\nweL9jccP8LEr0C7KJTIMXDcb+pZWVAHn2jE6pLH1bS25JJon3GyL1zH6e2B7tvdv\nrOtrSENELQKBgQC83uPPIGvUXXZmtL+Cr+P89uUlK6kEv0XDrGa8DJ7Op9Zxs4Ae\n918xO4jBUW2iD06oN9ZBBuR6fTb+iI7duR75sat/ZrreOw00RDVFomjtkpOGLaAb\nRMUwI4RMPPbofNxNqgNUGWSHsoWDE9ZyGYO/cu/GbUm+8U9MWFGqL3UmgQKBgFz8\niNzT2ZlJc4UfL/hJ4kc9u8w2O3c6RW1gSHczkoAAW2eviptLEAwmGoqRGJC1nllN\nUMeivOuGf5xx6jUEbMIPwl38bLJuuNU97TIiLmn+OeagS9daA6t2R1vKV0QoMRJs\nvFLDKtwIKM0mkc37AMlJjaPpVbsaqpborjZNE5ehAoGBALOeT1efjJxJ1/4hAK/J\ngWZZmBCa/ubxvrva39d0vP6558KumH6B7ZL1tDUjxiD6KOS1x9D2dbEGq9ZBxnYY\nuvdN2D3ouhSmHW9BGE4icXFvfT8Rvx758L5YpAFt+G2d5nynKKC4zapB/4CwKFx5\n92Tjfr8I4OVtNa4OlWVzVDMH\n-----END PRIVATE KEY-----\n",>> firebase-service-account.json
echo   "client_email": "firebase-adminsdk-fbsvc@watsland-96923.iam.gserviceaccount.com",>> firebase-service-account.json
echo   "client_id": "112741566684303031113",>> firebase-service-account.json
echo   "auth_uri": "https://accounts.google.com/o/oauth2/auth",>> firebase-service-account.json
echo   "token_uri": "https://oauth2.googleapis.com/token",>> firebase-service-account.json
echo   "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",>> firebase-service-account.json
echo   "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%%40watsland-96923.iam.gserviceaccount.com",>> firebase-service-account.json
echo   "universe_domain": "googleapis.com">> firebase-service-account.json
echo }>> firebase-service-account.json

echo ✅ Fichier firebase-service-account.json créé localement

REM Upload via SCP (nécessite un client SSH comme PuTTY/OpenSSH)
echo 📤 Upload du fichier vers le serveur...
scp firebase-service-account.json root@srv919743.hosting-data.io:/var/www/whatslandllt/backend/firebase-service-account.json

if %ERRORLEVEL% == 0 (
    echo ✅ Upload réussi!
    
    REM Configuration des permissions et redémarrage
    echo 🔐 Configuration des permissions et redémarrage des services...
    ssh root@srv919743.hosting-data.io "cd /var/www/whatslandllt && chmod 600 backend/firebase-service-account.json && chown root:root backend/firebase-service-account.json && pm2 stop whatsland && pm2 delete whatsland && pm2 restart whatsland-backend && cd frontend && npm run build"
    
    if %ERRORLEVEL% == 0 (
        echo ✅ Configuration terminée!
        echo 🧪 Test de la connexion Firebase...
        ssh root@srv919743.hosting-data.io "cd /var/www/whatslandllt && node test-firebase-connection.js"
    ) else (
        echo ❌ Erreur lors de la configuration sur le serveur
    )
) else (
    echo ❌ Erreur lors de l'upload SCP
    echo 💡 Alternative: Utilisez WinSCP, FileZilla, ou copiez manuellement le fichier
)

REM Nettoyer le fichier temporaire local
del firebase-service-account.json
echo 🧹 Fichier temporaire nettoyé

echo.
echo 🎉 Déploiement terminé!
echo 🌐 Testez votre application sur: http://whatsland.click
echo 📋 Vérifiez que l'erreur Firebase a disparu dans la console navigateur

pause