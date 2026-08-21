package main

import (
	"encoding/json"
	"fmt"

	//"time"

	//"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	//"github.com/stretchr/testify"
	//"github.com/gofiber/fiber/v3/middleware/cors"
)

type Data struct {
	Start  string `json:"startLink"`
	Target string `json:"TargetLink"`
	Method string `json:"searchType"`
	All	   string `json:"searchAll"`
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/search", searchHandler)

	//handler := cors.Default().Handler(mux)

	log.Println("Server is running on http://localhost:3001/search")

	err := http.ListenAndServe(":3001", corsHandler(mux)) // Use the CORS handler here
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}

func corsHandler(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Set CORS headers
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		// If it's a preflight request, respond with 200 OK
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		// Call the original handler
		h.ServeHTTP(w, r)
	})
}

func searchHandler(w http.ResponseWriter, r *http.Request) {
	// Parse form data
	//enableCors(&w)
	//w.Header().Set("Access-Control-Allow-Origin", "*")
	//w.Header().Set("Access-Control-Allow-Methods", "POST")
	//w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	err := r.ParseForm()
	if err != nil {
		http.Error(w, "Error parsing form data", http.StatusInternalServerError)
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Failed to read request body", http.StatusInternalServerError)
		return
	}

	// Get form values
	var data Data
	if err := json.Unmarshal(body, &data); err != nil {
		http.Error(w, "Failed to unmarshal request body", http.StatusBadRequest)
		return
	}

	startWord := data.Start
	targetWord := data.Target
	searchMethod := data.Method
	searchAll := data.All
	startWord = strings.ReplaceAll(startWord, " ", "_")
	targetWord = strings.ReplaceAll(targetWord, " ", "_")
	// Do something with the form data
	log.Printf("Received form data: Start Word = %s, Target Word = %s\n", startWord, targetWord)

	// You can send a response back to the client if needed
	//fmt.Fprintf(w, "Received form data: Start Word = %s, Target Word = %s\n", startWord, targetWord)

	//runWikiRace(startWord, targetWord, searchMethod);
	bfsMethod := true
	if searchMethod == "IDS" {
		bfsMethod = false
	}
	searchAllBool := false
	if searchAll == "Yes"  {
		searchAllBool = true
	}
	fmt.Println(searchAll, searchAllBool)
	fmt.Println(searchMethod, bfsMethod)
	path_result, timer, visit_count := runAlgorithm(startWord, targetWord, bfsMethod, searchAllBool)
	// Set the content type header to JSON

	response := struct {
		PathResult [][]string `json:"pathResult"`
        Timer      int64 `json:"timer"`
		Count	   int32 `json:"count"`
		}{
			PathResult: path_result,
        	Timer:      timer.Milliseconds(),
			Count: 		visit_count,
    	}
	
    // Encode the response object as JSON
    jsonResponse, err := json.Marshal(response)
    if err != nil {
		http.Error(w, "Failed to encode response as JSON", http.StatusInternalServerError)
        return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write(jsonResponse)
};

//func runWikiRace(start string, target string, searchType string) {
//    bfsMethod := true
//    if searchType == "IDS" {
//        bfsMethod = false
//    }
//    path_result := runAlgorithm(start, target, bfsMethod)
//    // Set the content type header to JSON
//    w.Header().Set("Content-Type", "application/json")
//
//    // Write the JSON-encoded result to the response body
//    w.Write(result)
//    //fmt.Println(searchType)
//    //fmt.Println(start, target)
//}
