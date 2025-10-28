from flask import Flask, request, jsonify, render_template
import pickle
import numpy as np
import pandas as pd
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


with open("xgboost_model.pkl", "rb") as f:
    data = pickle.load(f)
    model = data["model"]
    label_encoder = data["label_encoder"]


df = pd.read_csv("CricX_dataset_combined - Sheet1 (1).csv")
df["team1"] = df["team1"].astype(str).str.strip().str.lower()
df["team2"] = df["team2"].astype(str).str.strip().str.lower()


def preprocess_input(row, home_adv, weather, pitch):
    return np.array([
        home_adv,
        row["h2h_t1_wins"],
        row["h2h_t2_wins"],
        row["team1_recent_win_pct"],
        row["team2_recent_win_pct"],
        row["team1_top5_bat_avg"],
        row["team2_top5_bat_avg"],
        row["team1_top5_bowl_avg"],
        row["team2_top5_bowl_avg"],
        weather,   # 0=Sunny, 1=Cloudy, 2=Rain
        pitch,     # 0=Balanced, 1=Pace-friendly, 2=Spin-friendly, 3=Batting-friendly
    ]).reshape(1, -1)
@app.route("/")
def home():
    return render_template("index.html")

@app.route("/about")
def about():
    return render_template("about.html")

@app.route("/knowledge")
def knowledge():
    return render_template("knowledge.html")

@app.route("/predict")
def predict_page():
    return render_template("predict.html")

@app.route("/predict", methods=["POST"])
def predict():
    try:
       
        team1 = request.form["team1"].strip().lower()
        team2 = request.form["team2"].strip().lower()
        venue = request.form["venue"].strip().lower()
        weather = int(request.form["weather"])  
        pitch = int(request.form["pitch"])      

       
        home_adv = 1 if venue == "home" else 0

      
        row = df[(df["team1"] == team1) & (df["team2"] == team2)]

        if row.empty:
            avg_row = df.mean(numeric_only=True)
            features = np.array([
                home_adv,
                avg_row["h2h_t1_wins"],
                avg_row["h2h_t2_wins"],
                avg_row["team1_recent_win_pct"],
                avg_row["team2_recent_win_pct"],
                avg_row["team1_top5_bat_avg"],
                avg_row["team2_top5_bat_avg"],
                avg_row["team1_top5_bowl_avg"],
                avg_row["team2_top5_bowl_avg"],
                weather,
                pitch,
            ]).reshape(1, -1)

            probs = model.predict_proba(features)[0]
            result = label_encoder.inverse_transform([np.argmax(probs)])[0]

            return jsonify({
                "note": "Match not found, fallback to averages",
                "team1": team1,
                "team2": team2,
                "venue": venue,
                "prob_team1": round(float(probs[0]) * 100, 2),
                "prob_team2": round(float(probs[1]) * 100, 2),
                "predicted_result": str(result)
            })

        # Use matched row
        row = row.iloc[0]
        features = preprocess_input(row, home_adv, weather, pitch)
        probs = model.predict_proba(features)[0]
        classes = label_encoder.inverse_transform(np.arange(len(probs)))
        
        prob_dict = {cls: prob for cls, prob in zip(classes, probs)}
        result = label_encoder.inverse_transform([np.argmax(probs)])[0]

        return jsonify({
            "team1": team1,
            "team2": team2,
            "venue": venue,
            "prob_team1": round(float(prob_dict.get("Team1", 0)) * 100, 2),
            "prob_team2": round(float(prob_dict.get("Team2", 0)) * 100, 2),
            "prob_draw": round(float(prob_dict.get("Draw", 0)) * 100, 2),
            "predicted_result": str(result)
        })

    except Exception as e:
        return jsonify({"error": str(e)})

if __name__ == "__main__":
    app.run(debug=True)


