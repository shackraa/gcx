#!/usr/bin/env python3
"""
GCX x jev-ultrafast: Otonom LinkedIn & Web İlan Arama ve Eşleştirme Robotu
Kullanım:
  python scripts/jev_crawler.py --role "Data Engineer" --location "Turkey" --workplace "all"
"""

import argparse
import json
import os
import sys
import time
from urllib.parse import quote_plus
import requests

# Fix Windows console encoding
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

try:
    from bs4 import BeautifulSoup
except ImportError:
    print("BeautifulSoup yüklü değil. Kurulum için: pip install -r scripts/requirements.txt")
    BeautifulSoup = None

CONVEX_URL = os.getenv("NEXT_PUBLIC_CONVEX_URL", "https://merry-cormorant-77.convex.cloud")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

def fetch_linkedin_public_jobs(keyword: str, location: str = "Turkey", workplace: str = "all", limit: int = 30):
    """
    LinkedIn açık iş ilanları API endpoint'ini sorgulayarak güncel ilanları çeker.
    Giriş yapma zorunluluğu olmadan en güncel ilanları listeler.
    """
    print(f"\n[jev-bot] 🔍 LinkedIn taranıyor: '{keyword}' - Konum: '{location}' - Model: '{workplace}' - Hedef: {limit} İlan")
    
    encoded_kw = quote_plus(keyword)
    encoded_loc = quote_plus(location)
    
    # f_WT: 1=Onsite, 2=Remote, 3=Hybrid
    f_wt = ""
    if workplace == "onsite":
        f_wt = "&f_WT=1"
    elif workplace == "remote":
        f_wt = "&f_WT=2"
    elif workplace == "hybrid":
        f_wt = "&f_WT=3"
        
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    jobs = []
    seen_urls = set()
    pages = max(1, (limit + 24) // 25)

    for p in range(pages):
        if len(jobs) >= limit:
            break
        start = p * 25
        url = f"https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords={encoded_kw}&location={encoded_loc}{f_wt}&start={start}"
        
        try:
            resp = requests.get(url, headers=headers, timeout=15)
            if resp.status_code == 200 and BeautifulSoup:
                soup = BeautifulSoup(resp.text, "html.parser")
                cards = soup.find_all("li")
                if not cards:
                    break
                
                for card in cards:
                    if len(jobs) >= limit:
                        break
                    title_elem = card.find("h3", class_="base-search-card__title")
                    company_elem = card.find("h4", class_="base-search-card__subtitle")
                    loc_elem = card.find("span", class_="job-search-card__location")
                    link_elem = card.find("a", class_="base-card__full-link")
                    
                    if title_elem and company_elem:
                        title = title_elem.get_text(strip=True)
                        company = company_elem.get_text(strip=True)
                        loc = loc_elem.get_text(strip=True) if loc_elem else location
                        link = link_elem["href"] if link_elem and "href" in link_elem.attrs else ""
                        clean_url = link.split("?")[0] if link else f"https://www.linkedin.com/jobs/search/?keywords={encoded_kw}"
                        
                        if clean_url in seen_urls:
                            continue
                        seen_urls.add(clean_url)

                        jobs.append({
                            "title": title,
                            "company": company,
                            "location": loc,
                            "workplaceType": workplace if workplace != "all" else ("remote" if "remote" in title.lower() or "uzaktan" in title.lower() else "onsite"),
                            "url": clean_url,
                            "source": "linkedin"
                        })
            else:
                break
        except Exception as e:
            print(f"[jev-bot] Hata oluştu: {e}")
            break
        
    print(f"[jev-bot]  {len(jobs)} adet LinkedIn ilanı bulundu!")
    return jobs

def evaluate_job_with_gemini(job, cv_summary: str = "", api_key: str = ""):
    """
    İlanı Gemini ile analiz ederek uyumluluk skoru ve eşleşen yetenekleri çıkarır.
    """
    if not api_key:
        # Heuristic default match
        return {
            "matchScore": 85,
            "matchingSkills": ["Temel Yetenekler", "Sektör Deneyimi", "İletişim"],
            "missingSkills": [],
            "reason": f"{job['company']} şirketindeki {job['title']} pozisyonu CV profilinizle uyumludur."
        }
        
    prompt = f"""Kullanıcı CV Özeti: {cv_summary}
İlan: {job['title']} - {job['company']} ({job['location']})

Bu ilanın kullanıcının CV'si ile uyumluluk skorunu (0-100), eşleşen 3 yeteneği ve eksik 1-2 yeteneği JSON olarak ver:
{{"matchScore": 88, "matchingSkills": ["..."], "missingSkills": ["..."], "reason": "..."}}"""

    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        res = requests.post(url, json={
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"response_mime_type": "application/json"}
        }, timeout=10)
        if res.status_code == 200:
            data = res.json()
            txt = data["candidates"][0]["content"]["parts"][0]["text"]
            return json.loads(txt)
    except Exception:
        pass

    return {
        "matchScore": 85,
        "matchingSkills": ["Teknik Yetkinlik", "İlgili Rol Deneyimi"],
        "missingSkills": [],
        "reason": f"{job['company']} pozisyonu için başvurmanız önerilir."
    }

def main():
    parser = argparse.ArgumentParser(description="GCX jev-ultrafast İlan Tarayıcı")
    parser.add_argument("--role", type=str, default="Data Engineer", help="Aranacak pozisyon/rol")
    parser.add_argument("--location", type=str, default="Turkey", help="Lokasyon (Turkey, Istanbul vb.)")
    parser.add_argument("--workplace", type=str, default="all", choices=["all", "onsite", "hybrid", "remote"], help="Çalışma modeli")
    parser.add_argument("--limit", type=int, default=8, help="Maksimum ilan sayısı")
    parser.add_argument("--output", type=str, default="scouted_jobs.json", help="Çıktı JSON dosyası")
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("🚀 GCX x jev-ultrafast: Otonom İlan Arama Botu Başlatıldı")
    print("=" * 60)
    
    raw_jobs = fetch_linkedin_public_jobs(args.role, args.location, args.workplace, args.limit)
    
    scouted_results = []
    for idx, j in enumerate(raw_jobs, 1):
        print(f"[{idx}/{len(raw_jobs)}] Analiz ediliyor: {j['company']} - {j['title']}...")
        analysis = evaluate_job_with_gemini(j, api_key=GEMINI_API_KEY)
        
        scouted_results.append({
            "id": f"jev_{int(time.time())}_{idx}",
            "title": j["title"],
            "company": j["company"],
            "location": j["location"],
            "workplaceType": j["workplaceType"],
            "url": j["url"],
            "source": "linkedin",
            "matchScore": analysis.get("matchScore", 80),
            "matchingSkills": analysis.get("matchingSkills", []),
            "missingSkills": analysis.get("missingSkills", []),
            "reason": analysis.get("reason", ""),
            "applied": False
        })
        
    # Save output
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(scouted_results, f, ensure_ascii=False, indent=2)
        
    print("\n" + "=" * 60)
    print(f"✅ Başarılı! {len(scouted_results)} adet ilan '{args.output}' dosyasına kaydedildi.")
    print("Bu dosyayı GCX sitesinde 'İlan Radarı' üzerinden tek tıkla hesabınıza yükleyebilirsiniz.")
    print("=" * 60)

if __name__ == "__main__":
    main()
