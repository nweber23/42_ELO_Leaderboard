package utils

import (
	"crypto/md5"
	"fmt"
)

// Adjectives for generating anonymous names
var adjectives = []string{
	"Swift", "Silent", "Mighty", "Clever", "Bold",
	"Fierce", "Mystic", "Noble", "Brave", "Quick",
	"Stealthy", "Cosmic", "Thunder", "Shadow", "Crystal",
	"Golden", "Silver", "Iron", "Blazing", "Frozen",
	"Ancient", "Electric", "Phantom", "Radiant", "Stellar",
	"Crimson", "Azure", "Emerald", "Obsidian", "Jade",
}

// Animals for generating anonymous names
var animals = []string{
	"Penguin", "Fox", "Wolf", "Eagle", "Tiger",
	"Dragon", "Phoenix", "Falcon", "Panther", "Bear",
	"Hawk", "Lion", "Shark", "Cobra", "Raven",
	"Owl", "Leopard", "Viper", "Lynx", "Puma",
	"Jaguar", "Scorpion", "Mantis", "Griffin", "Hydra",
	"Sphinx", "Kraken", "Chimera", "Basilisk", "Wyvern",
}

// DefaultAvatarURL returns a deterministic but anonymous avatar URL
// Uses DiceBear API to generate unique avatars based on user ID
func DefaultAvatarURL(userID int) string {
	// Use a hash of the user ID to ensure consistent but anonymous avatars
	hash := fmt.Sprintf("%x", md5.Sum([]byte(fmt.Sprintf("elo-player-%d", userID))))
	return fmt.Sprintf("https://api.dicebear.com/7.x/bottts/svg?seed=%s&backgroundColor=1e1e2e", hash[:8])
}

// GenerateAnonymousName generates a consistent anonymous name based on user ID
// The same user ID will always get the same anonymous name
func GenerateAnonymousName(userID int) string {
	// Use modulo to pick deterministic adjective and animal based on user ID
	adjIdx := userID % len(adjectives)
	animalIdx := (userID * 7) % len(animals) // Multiply by prime to spread distribution

	return fmt.Sprintf("%s %s", adjectives[adjIdx], animals[animalIdx])
}

// GenerateAnonymousLogin generates a consistent anonymous login based on user ID
func GenerateAnonymousLogin(userID int) string {
	return fmt.Sprintf("player%d", userID)
}
