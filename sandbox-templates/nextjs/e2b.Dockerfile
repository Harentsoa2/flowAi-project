# You can use most Debian-based base images
FROM node:22-slim

# Install curl
RUN apt-get update && apt-get install -y curl && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY compile_page.sh /compile_page.sh
RUN sed -i 's/\r$//' /compile_page.sh && chmod +x /compile_page.sh

# Install dependencies and customize sandbox
WORKDIR /home/user/nextjs-app

# 1. Création de l'application Next.js
RUN npx --yes create-next-app@16.1.0 . --yes

# 2. CRUCIAL : Forcer npm à ignorer les conflits de versions entre React 19 (Next 15/16) et Shadcn
RUN npm config set legacy-peer-deps true

# 3. Utilisation de "-d" (defaults) pour bypasser toutes les questions de configuration de Shadcn
RUN npx --yes shadcn@4.6.0 init -d -b base --force

# 4. Ajout de tous les composants
RUN npx --yes shadcn@4.6.0 add --all --yes

# Vérification de l'installation
RUN test -f components/ui/button.tsx && test -f components/ui/card.tsx

# 5. Déplacer TOUS les fichiers (y compris les fichiers cachés comme .eslintrc.json ou .next)
WORKDIR /home/user
RUN cp -a /home/user/nextjs-app/. /home/user/ && rm -rf /home/user/nextjs-app