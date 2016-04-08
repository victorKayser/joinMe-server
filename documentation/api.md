# Documentation de l'API de l'appli Hubz

__Notes :__
- Les paramètres précédés d'un * sont requis
- Certains paramètres doivent être passés dans l'URL
- La description de l'API est au format JSON

---

### POST `/register`

- `*username` : Nom d'utilisateur du compte
- `*phoneNumber` : Numéro de téléphone de l'utilisateur

Inscrit un utilisateur (particulier). Envoie un SMS avec le mot de passe généré au numéro fourni.

Pas de retour particulier.

---

### GET `/requestPasswordReset/:username/:phoneNumber`

- `*username` : Nom d'utilisateur du compte
- `*phoneNumber` : Numéro de téléphone du compte

Envoie un SMS de reset du mot de passe à l'utilisateur si les infos correspondent à un compte.
Génère un token de reset pour ce compte et le lie à l'utilisateur.

Pas de retour particulier.

---

### GET `/passwordReset/:token`

- `*token` : token de reset du mot de passe

Reset le mot de passe du compte lié au token passé.
Efface le token après coup et envoie un SMS avec le nouveau
mot de passe à l'utilisateur concerné.

Pas de retour particulier.

---

### GET `/actions`

Retourne les actions possibles pour la création d'un hubz.

```yaml
[
    {} # AdActions
]

```

---

### GET `/categories`

- `actionId` : Id de l'action en question

Retourne les catégories et sous-catégories disponibles pour l'action passée.
Ou toutes les actions si l'id n'est pas passé.

```yaml
[
    { # AdCategoriesParents
        categories: {}, # AdCategories
    }
]

```

---

### POST `/ads`

- `*model` : Données du hubz

*Authentification requise*

Enregistre le Hubz posté en base de données (si un modèle d'id passé existe, il sera mis à jour).
Seuls les modèles de l'utilisateur courant peuvent être mis à jour.
Les nouveaux modèles créés depuis cette route seront associés à l'utilisateur courant.

---


# Récupération de la liste des annonces sur l'accueil liste

Type : POST

Cette api va pusher les données dans une collection backbone, pour que la vue carte puise dedans afin d'afficher les POIs (voir ex yay)

Doit retourner:
    - id de l'annonce
    - nom du vendeur
    - note du vendeur
    - titre
    - description
    - catgorie (Vends, achète ...)
    - image principale
    - coordonnées gps du vendeur (comment l'obtenir?)


Paramètres :
    - Type de catégorie
        + Si aucune, afficher tout
    - coordonnées gps de l'utilisateur qui visualise la liste : pour effecter la distance entre les deux personnes
    - (optionnel) id user : pour afficher les hubz de l'utilisateur en question
    - (optionnel) favoris (booléen) : pour retourner uniquement mes hubz favoris
    - (optionnel) mots clefs de recherche
    - (optionnel) historique (booléen) : pour retourner mes anciens hubz

# Récupération des intitulés des catégories pour la liste déroulante

Type : GET

Doit retourner
    - id catégorie
    - intitulé
