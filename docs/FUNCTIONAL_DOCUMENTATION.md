# Laajal Sa Diine — Functional Documentation

> **Website:** [https://www.laajalsadiine.com](https://www.laajalsadiine.com)

---

## Table of Contents

1. [What is Laajal Sa Diine?](#1-what-is-laajal-sa-diine)
2. [Who is it for?](#2-who-is-it-for)
3. [The Content](#3-the-content)
4. [How the Application Works](#4-how-the-application-works)
   - 4.1 [Browsing Audio Content](#41-browsing-audio-content)
   - 4.2 [Searching for Audio](#42-searching-for-audio)
   - 4.3 [Listening to Audio](#43-listening-to-audio)
   - 4.4 [Downloading Audio](#44-downloading-audio)
   - 4.5 [Sharing Audio](#45-sharing-audio)
5. [User Roles](#5-user-roles)
   - 5.1 [Visitor (Public User)](#51-visitor-public-user)
   - 5.2 [Registered User](#52-registered-user)
   - 5.3 [Admin](#53-admin)
   - 5.4 [Super Admin](#54-super-admin)
6. [Admin Features](#6-admin-features)
   - 6.1 [Publishing New Audio](#61-publishing-new-audio)
   - 6.2 [Editing Existing Audio](#62-editing-existing-audio)
   - 6.3 [Deleting Audio](#63-deleting-audio)
   - 6.4 [Backup](#64-backup)
7. [Audio Content Structure](#7-audio-content-structure)
8. [Search & Filtering Capabilities](#8-search--filtering-capabilities)
9. [Analytics & Tracking](#9-analytics--tracking)
10. [Current Status & Future Vision](#10-current-status--future-vision)
11. [Glossary](#11-glossary)

---

## 1. What is Laajal Sa Diine?

**Laajal Sa Diine** is a web application that provides a library of short Islamic religious audio content in a **question-and-answer** format. The name comes from a phrase encouraging Muslims to deepen their understanding of their religion.

The platform hosts audio recordings where people ask questions about Islam, and a knowledgeable Islamic teacher provides answers. Both the question and the answer are heard in each recording. These audios are typically short — ranging from a few seconds up to about 5 minutes, rarely exceeding 10 minutes.

The goal is to make Islamic knowledge and guidance **easily accessible** to everyone, anywhere, at any time.

---

## 2. Who is it for?

The application serves **three main audiences**:

- **Muslim listeners** — Anyone who wants to learn about Islamic case law (*fiqh*), rulings, and practical daily-life guidance. The questions covered are the kind that any Muslim may want to ask.
- **Knowledge seekers** — People curious about Islamic perspectives on everyday situations, even without deep prior knowledge.
- **Content administrators** — Trusted individuals who manage and publish the audio content on the platform.

No technical knowledge is required to use the application as a listener. Simply visit the website, browse or search, and press play.

---

## 3. The Content

Each audio on the platform has the following characteristics:

| Attribute       | Description                                                                                   |
|-----------------|-----------------------------------------------------------------------------------------------|
| **Theme**       | The general topic category (e.g., Prayer, Fasting, Marriage, Behavior, Zakat, etc.)           |
| **Author**      | The Islamic teacher or scholar who answers the question                                       |
| **Description** | A brief summary of the question being asked and answered                                      |
| **Keywords**    | Relevant words that help find the audio through search                                        |
| **Date**        | The date associated with the audio (typically when it was recorded or published)               |
| **Duration**    | The length of the audio clip, displayed on each card                                          |

The subjects are diverse but all revolve around **Islamic religion and practical case law** that Muslims encounter in their daily lives. Topics include — but are not limited to:

- **Prayer** (*Salat*) — Rules, situations, and edge cases
- **Fasting** — Ramadan and voluntary fasting questions
- **Marriage** — Rights, obligations, and guidance
- **Behavior** — Daily conduct and character
- **Zakat** — Charitable giving rules
- **Inheritance** — Islamic succession law
- **Work & Profession** — Halal earnings and workplace situations
- **Sorcery & Spiritual matters** — Islamic perspective on spiritual issues

---

## 4. How the Application Works

### 4.1 Browsing Audio Content

When a visitor opens the website, they are presented with a **grid of audio cards**. Each card displays:

- The **theme** (colored label at the top-left)
- The **duration** of the audio (top-right)
- The **description** of the question/answer
- The **author name** (bottom-left)
- The **date** (bottom-right)

The audios are loaded in chronological order (most recent first) and more audios are **automatically loaded** as the user scrolls down the page (infinite scrolling).

### 4.2 Searching for Audio

The application provides two levels of search:

#### Simple Search (Keywords)
A search bar at the top of the page allows users to type keywords. The search is triggered automatically once at least 3 characters are typed. The system performs a **full-text search** across descriptions, keywords, themes, and authors.

#### Advanced Search
By clicking the **"Recherche avancée"** (Advanced Search) button, users can filter content by:

- **Keywords** — Free text search
- **Author** — Select from a dropdown of all available authors
- **Theme** — Select from a dropdown of all available themes
- **Date range** — Filter audios between a start date and an end date

All these filters can be combined together for precise results.

### 4.3 Listening to Audio

Clicking on an audio card starts playback. A **persistent audio player** appears at the bottom of the screen showing:

- The currently playing audio's information
- Playback controls (play, pause, progress bar)
- Duration display

The currently playing card is visually highlighted in the grid so the user always knows which audio is active.

### 4.4 Downloading Audio

Users can download any audio file to their device. The downloaded file is automatically named using the format: `Theme_Author_Date.mp3` for easy identification.

### 4.5 Sharing Audio

Each audio has a **unique shareable link**. When someone receives a shared link and opens it, the application loads directly to that specific audio, ready to play. A back arrow allows the user to navigate to the full audio library.

---

## 5. User Roles

The application has a role-based access system with four distinct levels:

### 5.1 Visitor (Public User)

- **No login required**
- Can browse all audios
- Can search and filter
- Can listen to audios
- Can download audios
- Can access shared audio links

### 5.2 Registered User

- Has a username, phone number, and optional email
- Can log in with username and phone number
- Can manage their own profile
- Access to the same features as visitors

### 5.3 Admin

- Must log in with email and password
- Can **create** new audio entries (upload audio files with metadata)
- Can **edit** existing audio metadata
- Can **delete** audio entries
- Can edit their own admin profile
- Cannot manage other admins

### 5.4 Super Admin

- Has all the permissions of a regular Admin
- Can **create new admin accounts**
- Can **delete admin accounts**
- Can **modify any admin's information**
- Can **download a complete backup** of all audio files
- There is a special **root super admin** defined at the system level that always exists

---

## 6. Admin Features

### 6.1 Publishing New Audio

Admins access a dedicated audio creation page through the admin interface. To publish a new audio, they must provide:

1. **Audio file** — The actual audio file to upload (MP3 format)
2. **Theme** — The topic category
3. **Author** — The teacher/scholar name
4. **Description** — A summary of the content
5. **Keywords** — Relevant search terms
6. **Date** — The associated date (defaults to today if not specified)

The audio file is uploaded and stored in cloud storage (Amazon S3), while the metadata is saved in the database.

### 6.2 Editing Existing Audio

Admins can update the metadata of any existing audio (theme, author, description, keywords, date) through the admin interface. The audio file itself is not replaced during an edit — only the descriptive information is updated.

### 6.3 Deleting Audio

Admins can permanently remove an audio entry. This deletes both the metadata from the database and the audio file from cloud storage.

### 6.4 Backup

Super admins can download a complete backup of all audio files as a single compressed ZIP archive. This ensures content preservation.

---

## 7. Audio Content Structure

Here is a visual summary of what makes up an audio entry in the system:

```
┌─────────────────────────────────────────────┐
│                 AUDIO ENTRY                 │
├─────────────────────────────────────────────┤
│  Theme       : PRIERE (Prayer)              │
│  Author      : IMAM MOUSTIQUE GARE          │
│  Description : "Que faire lorsque l'heure   │
│                 de la prière nous trouve     │
│                 dans un embouteillage en     │
│                 voiture ?"                   │
│  Keywords    : prière, voiture, heure,      │
│                embouteillage                 │
│  Date        : 03/11/2024                   │
│  Audio File  : [stored in cloud - S3]       │
│  Duration    : 04:56                        │
└─────────────────────────────────────────────┘
```

---

## 8. Search & Filtering Capabilities

The search system is designed to help users find relevant content quickly:

| Filter         | How it Works                                                                 |
|----------------|-----------------------------------------------------------------------------|
| **Keywords**   | Full-text search across descriptions, keywords, themes, and authors. Results are ranked by relevance. Keywords have the highest search weight. |
| **Theme**      | Exact match filter — shows only audios in the selected theme category        |
| **Author**     | Exact match filter — shows only audios by the selected author                |
| **Date range** | Shows audios within the specified date range (inclusive)                      |

Filters can be **combined**. For example, a user can search for keyword "prière" by author "IMAM X" within the last 6 months.

The search language is configured for **French**, which ensures proper text analysis and stemming for French-language queries.

---

## 9. Analytics & Tracking

The application tracks basic usage analytics to understand how the content is being consumed. The following events are recorded:

| Event                    | When it is triggered                           |
|--------------------------|------------------------------------------------|
| **Page Load**            | Each time a user opens the application          |
| **Start Listening Audio**| Each time a user starts playing an audio        |
| **Audio Downloaded**     | Each time a user downloads an audio file        |

Each user is assigned an **anonymous client ID** (stored in the browser's local storage) so that events can be grouped by visitor without collecting any personal information.

---

## 10. Current Status & Future Vision

### Current State

- ✅ **Web application** is live and deployed at [https://www.laajalsadiine.com](https://www.laajalsadiine.com)
- ✅ Audio browsing, searching, listening, and downloading are fully functional
- ✅ Admin interface for content management is operational
- ✅ Basic analytics tracking is in place

### Future Vision

- 📱 **Mobile application** — A dedicated mobile app (iOS/Android) is planned. The backend is already designed as a REST API to support multiple frontend clients.
- 🎨 **UI/UX improvements** — The web interface is functional but will be enhanced for a better user experience.
- 🔧 **Additional features** — Various improvements and new features are planned for future development.

---

## 11. Glossary

| Term               | Definition                                                                                  |
|--------------------|--------------------------------------------------------------------------------------------|
| **Fatwa**          | An Islamic ruling or guidance on a specific matter, typically given by a qualified scholar   |
| **Fiqh**           | Islamic jurisprudence — the study of Islamic law and its application to daily life          |
| **Zakat**          | Obligatory charitable giving in Islam, one of the five pillars of the faith                |
| **Salat**          | The Islamic prayer, performed five times daily                                              |
| **Imam**           | A person who leads prayers or serves as a religious leader/teacher in Islam                 |
| **Halal**          | Permissible or lawful according to Islamic law                                             |
| **Laajal Sa Diine**| A phrase encouraging Muslims to deepen their understanding of their religion                |

---

*This documentation describes the functional and business aspects of the Laajal Sa Diine project. For technical details about the architecture, code structure, and development setup, please refer to the [Technical Documentation](./TECHNICAL_DOCUMENTATION.md).*
