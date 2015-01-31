app.controller("artistSearch", function($scope, $state, $http) {
  var apiKey = API_KEY;
  initialize();

  function initialize() {
    $scope.artistName = "";
    $scope.liveSearchData = [];
    $scope.error = "";
  }

  $scope.findSongs = function() {
    if ($scope.artistName == "")
      return;
    $state.go('result', {name: $scope.artistName});
  };

  function getArtistListUrl(artistName, limit) {
    return 'http://ws.audioscrobbler.com/2.0/?method=artist.search'
      +'&artist=' + encodeURIComponent(artistName)
      +'&format=json'
      +'&limit=' + limit
      +'&api_key=' + apiKey;
  }

  $scope.liveSearch = function() {
    if (!$scope.artistName){
      initialize();
      $scope.artistName = "";
      return;
    }
    var url = getArtistListUrl($scope.artistName, 5);
    var artistListAjaxPromise = $http.get(url);
    artistListAjaxPromise.success(function(data) {
      if (data.error) {
        $scope.error = data.message;
        return;
      }
      $scope.liveSearchData = formatLiveData(data.results.artistmatches.artist);
      $scope.error = "";
    });
    artistListAjaxPromise.error(onError);
  };

  function formatLiveData(data) {
    if (!data) {
      $scope.error = "artist not found";
      return [];
    }
    return data.length ? _formatLiveDataFromArray(data) : _formatLiveDataFromObject(data);
  }

  function _formatLiveDataFromArray(data) {
    var result = [];
    for (var i=0; i<data.length; i++) {
      var artist = data[i];
      result.push({name: artist.name, listeners: artist.listeners, mbid: artist.mbid, image: _getImageFromLiveData(artist)});
    }
    return result;
  }

  function _getImageFromLiveData(data) {
    if (!data.image)
     return undefined;
    return data.image.length > 1 ? data.image[1]['#text'] : data.image[0]['#text'];
  }

  function _formatLiveDataFromObject(data) {
    return [{name: data.name, mbid: data.mbid, image: _getImageFromLiveData(data)}];
  }

  function onError() {
    $scope.error = "Failed retriving information.";
  }

});

app.controller("songController",  function($scope, $stateParams, $http, $ionicSlideBoxDelegate) {
    var apiKey = API_KEY;
    $scope.artistData = null;

    initialize();
    $scope.currentTrack = 1;

    function initialize() {
      $scope.navigation = false;
      $scope.track = {};
      $scope.error = "";
      getArtistTrackData($stateParams.mbid,$stateParams.name);
    }

    $scope.onSlideChange = function(i) {
      if(i == 0)
        $scope.prevSong();
      else if(i == 2)
        $scope.nextSong();
    };
    
    $scope.reload = function() {
      initialize();
      $scope.currentTrack = 1;
    };
    
    $scope.prevSong = function() {
      $scope.navigation = true;
      $scope.currentTrack-=1;
      if ($scope.currentTrack < 1) {
        $scope.currentTrack = 1;
        $ionicSlideBoxDelegate.slide(1);
        return;
      }
      getTrack();
    };
    
    $scope.nextSong = function() {
      $scope.navigation = true;
      $scope.currentTrack+=1;
      getTrack();
    };

    function getArtistTrackData(mbid, name) {
      if (!mbid && !name) {
        onError();
        return;
      }

      $http.get(mbid?getArtistUrlByMbid(mbid):getArtistUrlByName(name))
        .success(function(data) {
          if (data.error) {
            $scope.error = data.message;
            return;
          }
          $scope.artistData = mbid ? data.artist : data.results.artistmatches.artist;
          getTrack();
        })
        .error(onError);
    }

    function getTrack() {
      //TODO: cache album covers
      if (!$scope.artistData)
        return;
      var url = getTrackUrl($scope.artistData.name);
      var trackAjaxPromise = $http.get(url);
      trackAjaxPromise.success(function(data) {onTrackAjaxSuccess(data, $scope.artistData) });
      trackAjaxPromise.error(onError);
    }

    function onTrackAjaxSuccess(data, artist) {
      $ionicSlideBoxDelegate.slide(1);
      if (data.error) {
        onError();
        return;
      }

      //TODO: check screen resolution
      //get pic so that it looks good, bu doesn't eat all the data

      var track = data.toptracks.track;
      $scope.track = {
        image: track.image ?
          track.image[track.image.length - 1]['#text'] :
          artist.image[artist.image.length - 1]['#text'],
        background: artist.image[artist.image.length - 1]['#text'],
        artist: track.artist.name,
        name: track.name
      };
    }

    function onError() {
      $scope.error = "Failed retriving information.";
    }

    function getTrackUrl(artistName) {
      return 'http://ws.audioscrobbler.com/2.0/?method=artist.getTopTracks'
        +'&artist='+encodeURIComponent(artistName)
        +'&format=json'
        +'&limit=1'
        +'&page=' + $scope.currentTrack
        +'&api_key=' + apiKey;
    }

    function getArtistUrlByName(artistName) {
      return 'http://ws.audioscrobbler.com/2.0/?method=artist.search'
        +'&artist=' + encodeURIComponent(artistName)
        +'&format=json'
        +'&limit=1'
        +'&api_key=' + apiKey;
    }
    
    function getArtistUrlByMbid(mbid) {
      return 'http://ws.audioscrobbler.com/2.0/?method=artist.getInfo'
        +'&mbid='+mbid
        +'&format=json'
        +'&limit=1'
        +'&api_key=' + apiKey;
    }
});